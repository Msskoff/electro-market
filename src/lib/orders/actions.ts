"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { refreshPublicSite } from "@/lib/admin/revalidate";
import { adminOrNull } from "@/lib/admin/session";
import { recordFromRequest } from "@/lib/analytics/server";
import { getSessionUser } from "@/lib/auth/session";
import { readCurrentCart, writeCurrentCart } from "@/lib/cart/store";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "./status";

/**
 * Actions des commandes. Les montants, le stock et les transitions de statut sont
 * calculés et vérifiés en base (fonctions place_order, submit_payment_proof,
 * cancel_my_order, admin_update_order) : ces actions valident les entrées et
 * relaient les messages d'erreur, rédigés pour être affichés tels quels.
 */

export type OrderActionResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

const SESSION_EXPIRED = { ok: false as const, error: "Votre session a expiré : reconnectez-vous pour continuer." };

/** Message d'erreur de la base (déjà en français pour les refus métier), sinon message générique. */
function dbMessage(error: { message: string; code?: string }): string {
  return ["P0001", "P0002", "22023", "42501"].includes(error.code ?? "") ? error.message : "Une erreur est survenue. Réessayez dans un instant.";
}

// ------------------------------------------------------------------ Client

const placeSchema = z.object({
  addressId: z.uuid("Choisissez une adresse de livraison."),
  method: z.enum(["moov", "mixx", "cod"], { message: "Choisissez un moyen de paiement." }),
  note: z.string().trim().max(500, "500 caractères maximum.").optional().default(""),
  expectedTotal: z.number().int().min(0),
});

export async function placeOrder(input: z.input<typeof placeSchema>): Promise<OrderActionResult<{ number: string }>> {
  const user = await getSessionUser();
  if (!user) return SESSION_EXPIRED;
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Requête invalide." };

  const lines = await readCurrentCart();
  if (lines.length === 0) return { ok: false, error: "Votre panier est vide." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_items: lines,
    p_address_id: parsed.data.addressId,
    p_method: parsed.data.method,
    p_note: parsed.data.note,
    p_expected_total: parsed.data.expectedTotal,
  });
  const order = data?.[0];
  if (error || !order) return { ok: false, error: error ? dbMessage(error) : "Commande impossible." };

  await writeCurrentCart([]);
  recordFromRequest(await headers(), { type: "order", path: "/commande", value: order.total });
  refreshPublicSite("catalog"); // stock réservé : fiches et disponibilités à jour
  return { ok: true, number: order.number };
}

const PROOF_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" };
const MAX_PROOF_BYTES = 3.5 * 1024 * 1024;

function looksLikeProof(bytes: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  return (bytes[0] === 0xff && bytes[1] === 0xd8) || ascii(1, 4) === "PNG" || (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") || ascii(0, 5) === "%PDF-";
}

const proofSchema = z.object({
  orderId: z.uuid(),
  reference: z.string().trim().min(3, "Référence de la transaction : 3 caractères minimum.").max(60),
  amount: z.coerce.number().int("Montant en francs CFA entiers.").min(1, "Montant payé obligatoire."),
  paidAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date et heure du paiement obligatoires.")
    .refine((v) => new Date(`${v}:00Z`).getTime() <= Date.now() + 86_400_000, "Date dans le futur."),
});

/** Preuve de paiement : capture du SMS de confirmation (image ou PDF), stockée en privé. */
export async function submitPaymentProof(formData: FormData): Promise<OrderActionResult> {
  const user = await getSessionUser();
  if (!user) return SESSION_EXPIRED;
  const parsed = proofSchema.safeParse({
    orderId: formData.get("orderId"),
    reference: formData.get("reference"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Champs à corriger." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Ajoutez la capture de votre paiement." };
  const ext = PROOF_TYPES[file.type];
  if (!ext) return { ok: false, error: "Format accepté : photo (JPEG, PNG, WebP) ou PDF." };
  if (file.size > MAX_PROOF_BYTES) return { ok: false, error: "Fichier trop lourd (3,5 Mo maximum)." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikeProof(bytes)) return { ok: false, error: "Le fichier n'est pas une image ou un PDF valide." };

  const supabase = await createClient();
  const path = `${user.id}/${parsed.data.orderId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const storage = supabase.storage.from("preuves");
  const upload = await storage.upload(path, bytes, { contentType: file.type, upsert: false });
  if (upload.error) return { ok: false, error: "Envoi du fichier impossible. Réessayez." };

  // Heure saisie par le client = heure de Lomé (UTC+0).
  const { error } = await supabase.rpc("submit_payment_proof", {
    p_order: parsed.data.orderId,
    p_path: path,
    p_reference: parsed.data.reference,
    p_amount: parsed.data.amount,
    p_paid_at: `${parsed.data.paidAt}:00Z`,
  });
  if (error) {
    await storage.remove([path]);
    return { ok: false, error: dbMessage(error) };
  }
  return { ok: true };
}

export async function cancelMyOrder(orderId: string): Promise<OrderActionResult> {
  const user = await getSessionUser();
  if (!user) return SESSION_EXPIRED;
  if (!z.uuid().safeParse(orderId).success) return { ok: false, error: "Commande introuvable." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_order", { p_order: orderId });
  if (error) return { ok: false, error: dbMessage(error) };
  refreshPublicSite("catalog");
  return { ok: true };
}

// ------------------------------------------------------------------ Administration

const adminSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(ORDER_STATUSES as [string, ...string[]]),
  message: z.string().trim().max(500, "500 caractères maximum.").optional().default(""),
});

export async function adminUpdateOrder(input: z.input<typeof adminSchema>): Promise<OrderActionResult> {
  const admin = await adminOrNull();
  if (!admin) return { ok: false, error: "Session expirée ou accès refusé. Reconnectez-vous." };
  const parsed = adminSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Requête invalide." };
  const { error } = await admin.supabase.rpc("admin_update_order", {
    p_order: parsed.data.orderId,
    p_status: parsed.data.status,
    p_message: parsed.data.message,
  });
  if (error) return { ok: false, error: dbMessage(error) };
  if (parsed.data.status === "cancelled") refreshPublicSite("catalog");
  return { ok: true };
}
