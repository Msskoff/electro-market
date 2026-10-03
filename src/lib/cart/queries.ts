import "server-only";
import { findVariantsBySku } from "@/lib/catalog/repository";
import { getSettings } from "@/lib/settings/repository";
import { priceCart, type CartTotals } from "./pricing";
import { readCurrentCart } from "./store";

/**
 * Panier courant (celui du compte si le client est connecté, sinon celui de l'appareil),
 * tarifé à partir du catalogue (source de vérité serveur).
 */
export async function getCart(): Promise<CartTotals> {
  const lines = await readCurrentCart();
  const lookup = await findVariantsBySku(lines.map((l) => l.sku));
  return priceCart(lines, lookup, (await getSettings()).policies);
}
