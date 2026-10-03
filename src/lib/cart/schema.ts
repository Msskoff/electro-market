import { z } from "zod";
import { MAX_LINES, MAX_QTY_PER_LINE, SKU_MAX_LENGTH, SKU_PATTERN } from "./lines";

/**
 * Schémas Zod du panier (validation des Server Actions, côté serveur uniquement).
 * La logique pure (lecture du cookie, ajout, fusion…) est dans lines.ts, sans Zod,
 * pour rester légère côté navigateur.
 */
export * from "./lines";

export const skuSchema = z
  .string()
  .trim()
  .min(1)
  .max(SKU_MAX_LENGTH)
  .regex(SKU_PATTERN, "SKU invalide");

export const quantitySchema = z.coerce.number().int().min(0).max(MAX_QTY_PER_LINE);

export const cartLineSchema = z.object({
  sku: skuSchema,
  qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});

export const cartSchema = z.array(cartLineSchema).max(MAX_LINES);
