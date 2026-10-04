"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { recordFromRequest } from "@/lib/analytics/server";
import { z } from "zod";
import { findVariantsBySku } from "@/lib/catalog/repository";
import { addLine, countItems, quantitySchema, setLineQty, skuSchema } from "./schema";
import { pullAccountCart, readCurrentCart, writeCurrentCart } from "./store";

export type CartActionResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const addSchema = z.object({ sku: skuSchema, qty: quantitySchema.pipe(z.number().min(1)) });

export async function addToCart(input: { sku: string; qty: number }): Promise<CartActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  const { sku, qty } = parsed.data;
  const match = (await findVariantsBySku([sku])).get(sku);
  if (!match) return { ok: false, error: "Ce produit n'existe plus." };
  if (match.variant.stock <= 0) return { ok: false, error: "Ce produit est en rupture de stock." };

  const next = addLine(await readCurrentCart(), sku, Math.min(qty, match.variant.stock));
  await writeCurrentCart(next);
  revalidatePath("/panier");
  recordFromRequest(await headers(), { type: "add_to_cart", product_id: match.product.id });
  return { ok: true, count: countItems(next) };
}

const updateSchema = z.object({ sku: skuSchema, qty: quantitySchema });

export async function updateCartLine(formData: FormData): Promise<CartActionResult> {
  const parsed = updateSchema.safeParse({
    sku: formData.get("sku"),
    qty: formData.get("qty"),
  });
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  const next = setLineQty(await readCurrentCart(), parsed.data.sku, parsed.data.qty);
  await writeCurrentCart(next);
  revalidatePath("/panier");
  return { ok: true, count: countItems(next) };
}

/**
 * Client connecté : aligne l'appareil sur le panier du compte (modifié depuis un autre
 * appareil). Sans session, ne fait rien et renvoie null.
 */
export async function syncCartFromAccount(): Promise<{ count: number } | null> {
  const lines = await pullAccountCart();
  return lines ? { count: countItems(lines) } : null;
}
