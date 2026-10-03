import type { Product, ProductImage, Variant } from "./types";

/**
 * Fonctions pures dérivées d'un produit (utilisables côté serveur ET client).
 */

export function productPath(product: Pick<Product, "category" | "slug">): string {
  return `/${product.category}/${product.slug}`;
}

/** Visuel produit à URL stable (Open Graph + JSON-LD). */
export function productImagePath(product: Pick<Product, "category" | "slug">): string {
  return `${productPath(product)}/visuel.png`;
}

export function categoryPath(slug: string): string {
  return `/${slug}`;
}

/** Variante affichée par défaut : la moins chère disponible, sinon la première. */
export function defaultVariant(product: Product): Variant {
  const available = product.variants.filter((v) => v.stock > 0);
  const pool = available.length > 0 ? available : product.variants;
  return pool.reduce((min, v) => (v.price < min.price ? v : min), pool[0]);
}

/**
 * Photo principale d'une variante. À défaut, celle d'une variante de MÊME couleur
 * (ex. 128 Go et 256 Go partagent leurs photos) — jamais d'une autre couleur.
 */
export function primaryImage(product: Pick<Product, "variants">, variant: Variant): ProductImage | undefined {
  return (
    variant.images?.[0] ??
    product.variants.find((v) => v.color.name === variant.color.name && v.images?.length)?.images?.[0]
  );
}

export function priceRange(product: Product): { min: number; max: number } {
  const prices = product.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

/** Couleurs uniques d'un produit, dans l'ordre d'apparition. */
export function uniqueColors(product: Product): Variant["color"][] {
  const seen = new Map<string, Variant["color"]>();
  for (const v of product.variants) if (!seen.has(v.color.name)) seen.set(v.color.name, v.color);
  return [...seen.values()];
}

/** Remise en pourcentage entier (0 si aucun prix de référence supérieur). */
export function discountPercent(variant: Pick<Variant, "price" | "compareAtPrice">): number {
  const ref = variant.compareAtPrice;
  if (!ref || ref <= variant.price) return 0;
  return Math.round((1 - variant.price / ref) * 100);
}
