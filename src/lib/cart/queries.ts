import "server-only";
import { cookies } from "next/headers";
import { siteConfig } from "@/config/site";
import { findVariantsBySku } from "@/lib/catalog/repository";
import { priceCart, type CartTotals } from "./pricing";
import { CART_COOKIE, parseCart } from "./schema";

/** Panier courant, tarifé à partir du catalogue (source de vérité serveur). */
export async function getCart(): Promise<CartTotals> {
  const store = await cookies();
  const lines = parseCart(store.get(CART_COOKIE)?.value);
  const lookup = await findVariantsBySku(lines.map((l) => l.sku));
  return priceCart(lines, lookup, siteConfig.policies);
}
