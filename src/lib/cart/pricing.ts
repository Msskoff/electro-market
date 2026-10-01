import type { Product, Variant } from "@/lib/catalog/types";
import type { CartLine } from "./schema";

export interface PricedLine {
  sku: string;
  qty: number;
  product: Product;
  variant: Variant;
  unitPrice: number;
  lineTotal: number;
  /** Quantité réduite au stock disponible. */
  adjusted: boolean;
}

export interface CartTotals {
  lines: PricedLine[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  /** Montant restant pour obtenir la livraison offerte (0 si atteint). */
  remainingForFreeShipping: number;
}

export interface ShippingRules {
  freeShippingThreshold: number;
  shippingCost: number;
}

/**
 * Calcule le panier à partir des lignes du cookie et du catalogue.
 * Fonction pure : facile à tester, et c'est la seule source de vérité pour les montants.
 */
export function priceCart(
  lines: CartLine[],
  lookup: Map<string, { product: Product; variant: Variant }>,
  rules: ShippingRules,
): CartTotals {
  const priced: PricedLine[] = [];

  for (const line of lines) {
    const match = lookup.get(line.sku);
    if (!match || match.variant.stock <= 0) continue; // produit retiré ou épuisé
    const qty = Math.min(line.qty, match.variant.stock);
    priced.push({
      sku: line.sku,
      qty,
      product: match.product,
      variant: match.variant,
      unitPrice: match.variant.price,
      lineTotal: match.variant.price * qty,
      adjusted: qty !== line.qty,
    });
  }

  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = priced.reduce((sum, l) => sum + l.qty, 0);
  const freeShipping = subtotal >= rules.freeShippingThreshold;
  const shipping = itemCount === 0 || freeShipping ? 0 : rules.shippingCost;

  return {
    lines: priced,
    itemCount,
    subtotal,
    shipping,
    total: subtotal + shipping,
    remainingForFreeShipping: freeShipping ? 0 : rules.freeShippingThreshold - subtotal,
  };
}
