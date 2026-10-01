"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { findVariantsBySku } from "@/lib/catalog/repository";
import {
  CART_COOKIE,
  addLine,
  countItems,
  parseCart,
  quantitySchema,
  serializeCart,
  setLineQty,
  skuSchema,
  type CartLine,
} from "./schema";

export type CartActionResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

async function readCart(): Promise<CartLine[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

async function writeCart(lines: CartLine[]): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, serializeCart(lines), {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Lisible côté client uniquement pour afficher le compteur du panier.
    // Il ne contient aucun prix : les montants sont toujours recalculés côté serveur.
    httpOnly: false,
  });
}

const addSchema = z.object({ sku: skuSchema, qty: quantitySchema.pipe(z.number().min(1)) });

export async function addToCart(input: { sku: string; qty: number }): Promise<CartActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  const { sku, qty } = parsed.data;
  const match = (await findVariantsBySku([sku])).get(sku);
  if (!match) return { ok: false, error: "Ce produit n'existe plus." };
  if (match.variant.stock <= 0) return { ok: false, error: "Ce produit est en rupture de stock." };

  const next = addLine(await readCart(), sku, Math.min(qty, match.variant.stock));
  await writeCart(next);
  revalidatePath("/panier");
  return { ok: true, count: countItems(next) };
}

const updateSchema = z.object({ sku: skuSchema, qty: quantitySchema });

export async function updateCartLine(formData: FormData): Promise<CartActionResult> {
  const parsed = updateSchema.safeParse({
    sku: formData.get("sku"),
    qty: formData.get("qty"),
  });
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  const next = setLineQty(await readCart(), parsed.data.sku, parsed.data.qty);
  await writeCart(next);
  revalidatePath("/panier");
  return { ok: true, count: countItems(next) };
}
