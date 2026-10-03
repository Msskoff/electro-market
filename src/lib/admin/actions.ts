"use server";

import type { Json } from "@/lib/supabase/database.types";
import { refreshPublicSite } from "./revalidate";
import {
  brandSchema,
  categorySchema,
  issuesToErrors,
  productSchema,
  settingsSchema,
  type ProductInput,
} from "./schemas";
import { adminOrNull } from "./session";

/**
 * Actions de l'administration. Chacune revérifie le rôle (ne jamais se fier à la page
 * qui l'appelle) et la RLS de la base le revérifie encore à l'écriture.
 * Principe « Brouillon puis Publier » : save* écrit dans `drafts` (invisible du public),
 * publish* met en ligne (fonction SQL transactionnelle) puis rafraîchit le site.
 */

export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; errors?: Record<string, string> };

const DENIED = { ok: false as const, error: "Session expirée ou accès refusé. Reconnectez-vous." };
const today = () => new Date().toISOString().slice(0, 10);

function dbError(message: string): { ok: false; error: string } {
  return { ok: false, error: `La base a refusé l'opération : ${message}` };
}

// ------------------------------------------------------------------ Produits

export async function saveProductDraft(
  input: ProductInput,
  options: { isNew: boolean },
): Promise<ActionResult<{ id: string; savedAt: string }>> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Certains champs sont à corriger.", errors: issuesToErrors(parsed.error) };
  }
  const product = { ...parsed.data, updatedAt: today() };
  const db = admin.supabase;

  const [pubs, drafts, category, brand] = await Promise.all([
    db.from("products").select("id, category, slug, variants:data->variants"),
    db.from("drafts").select("key, category:data->>category, slug:data->>slug, variants:data->variants").eq("entity", "product"),
    db.from("categories").select("slug").eq("slug", product.category).maybeSingle(),
    db.from("brands").select("slug").eq("slug", product.brand).maybeSingle(),
  ]);
  if (!category.data) return { ok: false, error: "Catégorie inconnue.", errors: { category: "Catégorie inconnue." } };
  if (!brand.data) return { ok: false, error: "Marque inconnue.", errors: { brand: "Marque inconnue." } };

  type Other = { id: string; category: string; slug: string; variants: { sku: string }[] };
  const others: Other[] = [
    ...(pubs.data ?? []).map((p) => ({ id: p.id, category: p.category, slug: p.slug, variants: (p.variants as unknown as { sku: string }[]) ?? [] })),
    ...(drafts.data ?? []).map((d) => ({
      id: d.key,
      category: String(d.category ?? ""),
      slug: String(d.slug ?? ""),
      variants: (d.variants as unknown as { sku: string }[]) ?? [],
    })),
  ];

  // Nouvel identifiant unique (jamais modifié ensuite, contrairement à l'adresse).
  let id = product.id;
  if (options.isNew) {
    const taken = new Set(others.map((o) => o.id));
    for (let n = 2; taken.has(id); n++) id = `${product.id}-${n}`;
  }
  const elsewhere = others.filter((o) => o.id !== id);

  if (elsewhere.some((o) => o.category === product.category && o.slug === product.slug)) {
    return { ok: false, error: "Cette adresse est déjà utilisée par un autre produit.", errors: { slug: "Adresse déjà utilisée dans cette catégorie." } };
  }
  const skus = new Set(elsewhere.flatMap((o) => o.variants.map((v) => v.sku)));
  const errors: Record<string, string> = {};
  product.variants.forEach((v, i) => {
    if (skus.has(v.sku)) errors[`variants.${i}.sku`] = "Référence déjà utilisée par un autre produit.";
  });
  if (Object.keys(errors).length) return { ok: false, error: "Références en double.", errors };

  const data = { ...product, id } as unknown as Json;
  const { data: row, error } = await db
    .from("drafts")
    .upsert({ entity: "product", key: id, data }, { onConflict: "entity,key" })
    .select("updated_at")
    .single();
  if (error) return dbError(error.message);
  return { ok: true, id, savedAt: row.updated_at };
}

export async function publishProduct(id: string): Promise<ActionResult<{ path: string; publishedAt: string }>> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const { data, error } = await admin.supabase.rpc("publish_product", { p_id: id });
  if (error) return dbError(error.message);
  refreshPublicSite("catalog");
  return { ok: true, path: data, publishedAt: new Date().toISOString() };
}

/** Abandonne le brouillon : la version en ligne redevient la référence (ou le produit disparaît s'il n'a jamais été publié). */
export async function discardProductDraft(id: string): Promise<ActionResult> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const { error } = await admin.supabase.from("drafts").delete().eq("entity", "product").eq("key", id);
  return error ? dbError(error.message) : { ok: true };
}

/** Suppression définitive (version en ligne + brouillon). L'ancienne adresse redirige vers la catégorie. */
export async function deleteProduct(id: string): Promise<ActionResult> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const db = admin.supabase;
  const [a, b] = await Promise.all([
    db.from("products").delete().eq("id", id),
    db.from("drafts").delete().eq("entity", "product").eq("key", id),
  ]);
  const error = a.error ?? b.error;
  if (error) return dbError(error.message);
  refreshPublicSite("catalog");
  return { ok: true };
}

/** Bascule « En stock / Rupture » : immédiate (pas de brouillon), le site est rafraîchi aussitôt. */
export async function setProductInStock(id: string, inStock: boolean): Promise<ActionResult<{ inStock: boolean }>> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const { data, error } = await admin.supabase.from("products").update({ in_stock: inStock }).eq("id", id).select("in_stock").maybeSingle();
  if (error) return dbError(error.message);
  if (!data) return { ok: false, error: "Produit pas encore publié : publiez-le d'abord." };
  refreshPublicSite("catalog");
  return { ok: true, inStock: data.in_stock };
}

const IMAGE_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Signature binaire réelle du fichier (ne pas se fier au type déclaré par le navigateur). */
function looksLikeImage(bytes: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  return (
    (bytes[0] === 0xff && bytes[1] === 0xd8) || // JPEG
    ascii(1, 4) === "PNG" ||
    (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") ||
    ascii(4, 12).startsWith("ftypavi")
  );
}

/**
 * Photo produit (déjà redimensionnée et convertie en WebP dans le navigateur) → bucket
 * public « produits ». Nom de fichier unique : une photo modifiée change d'adresse
 * (le cache long des images reste juste).
 */
export async function uploadProductImage(formData: FormData): Promise<ActionResult<{ src: string }>> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const file = formData.get("file");
  const productId = String(formData.get("productId") ?? "produit").replace(/[^a-z0-9-]/g, "").slice(0, 80) || "produit";
  if (!(file instanceof File)) return { ok: false, error: "Aucun fichier reçu." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: "Format non accepté (JPEG, PNG, WebP ou AVIF)." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Photo trop lourde (3 Mo maximum après compression)." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikeImage(bytes)) return { ok: false, error: "Le fichier n'est pas une image valide." };

  const path = `${productId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const storage = admin.supabase.storage.from("produits");
  const { error } = await storage.upload(path, bytes, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return dbError(error.message);
  return { ok: true, src: storage.getPublicUrl(path).data.publicUrl };
}

// ------------------------------------------------------------------ Catégories

export async function saveCategoryDraft(input: unknown): Promise<ActionResult<{ savedAt: string }>> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certains champs sont à corriger.", errors: issuesToErrors(parsed.error) };
  const { data, error } = await admin.supabase
    .from("drafts")
    .upsert({ entity: "category", key: parsed.data.slug, data: parsed.data as unknown as Json }, { onConflict: "entity,key" })
    .select("updated_at")
    .single();
  if (error) return dbError(error.message);
  return { ok: true, savedAt: data.updated_at };
}

export async function publishCategory(slug: string): Promise<ActionResult<{ publishedAt: string }>> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const { error } = await admin.supabase.rpc("publish_category", { p_slug: slug });
  if (error) return dbError(error.message);
  refreshPublicSite("catalog");
  return { ok: true, publishedAt: new Date().toISOString() };
}

export async function discardCategoryDraft(slug: string): Promise<ActionResult> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const { error } = await admin.supabase.from("drafts").delete().eq("entity", "category").eq("key", slug);
  return error ? dbError(error.message) : { ok: true };
}

// ------------------------------------------------------------------ Marques (sans brouillon)

export async function saveBrand(input: unknown): Promise<ActionResult> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Champs à corriger.", errors: issuesToErrors(parsed.error) };
  const { error } = await admin.supabase.from("brands").upsert(parsed.data, { onConflict: "slug" });
  if (error) return dbError(error.message);
  refreshPublicSite("catalog");
  return { ok: true };
}

export async function deleteBrand(slug: string): Promise<ActionResult> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const { count } = await admin.supabase.from("products").select("id", { count: "exact", head: true }).eq("brand", slug);
  if (count) return { ok: false, error: `Impossible : ${count} produit(s) utilisent encore cette marque.` };
  const { error } = await admin.supabase.from("brands").delete().eq("slug", slug);
  if (error) return dbError(error.message);
  refreshPublicSite("catalog");
  return { ok: true };
}

// ------------------------------------------------------------------ Configuration

export async function saveSettingsDraft(input: unknown): Promise<ActionResult<{ savedAt: string }>> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certains champs sont à corriger.", errors: issuesToErrors(parsed.error) };
  const { data, error } = await admin.supabase
    .from("drafts")
    .upsert({ entity: "settings", key: "main", data: parsed.data as unknown as Json }, { onConflict: "entity,key" })
    .select("updated_at")
    .single();
  if (error) return dbError(error.message);
  return { ok: true, savedAt: data.updated_at };
}

export async function publishSettings(): Promise<ActionResult<{ publishedAt: string }>> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const { error } = await admin.supabase.rpc("publish_settings");
  if (error) return dbError(error.message);
  refreshPublicSite("settings");
  return { ok: true, publishedAt: new Date().toISOString() };
}

export async function discardSettingsDraft(): Promise<ActionResult> {
  const admin = await adminOrNull();
  if (!admin) return DENIED;
  const { error } = await admin.supabase.from("drafts").delete().eq("entity", "settings").eq("key", "main");
  return error ? dbError(error.message) : { ok: true };
}
