import { z } from "zod";

/**
 * Le panier est stocké dans un cookie sous forme minimale : SKU + quantité.
 * Les prix n'y figurent JAMAIS : ils sont recalculés côté serveur à partir du catalogue.
 */
export const CART_COOKIE = "vx_cart";
export const MAX_QTY_PER_LINE = 10;
export const MAX_LINES = 30;

export const skuSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Z0-9-]+$/, "SKU invalide");

export const quantitySchema = z.coerce.number().int().min(0).max(MAX_QTY_PER_LINE);

export const cartLineSchema = z.object({
  sku: skuSchema,
  qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});

export const cartSchema = z.array(cartLineSchema).max(MAX_LINES);

export type CartLine = z.infer<typeof cartLineSchema>;

/** Lit le cookie de façon tolérante : toute donnée invalide donne un panier vide. */
export function parseCart(raw: string | undefined | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = cartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(lines);
}

/** Ajoute une quantité à une ligne (ou la crée), plafonnée à MAX_QTY_PER_LINE. */
export function addLine(lines: CartLine[], sku: string, qty: number): CartLine[] {
  const existing = lines.find((l) => l.sku === sku);
  if (existing) {
    return lines.map((l) =>
      l.sku === sku ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY_PER_LINE) } : l,
    );
  }
  if (lines.length >= MAX_LINES) return lines;
  return [...lines, { sku, qty: Math.min(qty, MAX_QTY_PER_LINE) }];
}

/** Fixe la quantité d'une ligne ; 0 supprime la ligne. */
export function setLineQty(lines: CartLine[], sku: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.sku !== sku);
  return lines.map((l) => (l.sku === sku ? { ...l, qty: Math.min(qty, MAX_QTY_PER_LINE) } : l));
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}
