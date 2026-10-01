import "server-only";
import { brands, categories, products } from "./data";
import type { Brand, Category, Product, Review, Variant } from "./types";

/**
 * Couche d'accès au catalogue.
 *
 * Toutes les pages et actions passent par ces fonctions, jamais par `data.ts`.
 * Pour brancher PostgreSQL, il suffit de réimplémenter ce module avec la même
 * signature : aucun composant n'a besoin de changer.
 */

export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return categories.find((c) => c.slug === slug);
}

export async function getBrands(): Promise<Brand[]> {
  return brands;
}

export async function getBrand(slug: string): Promise<Brand | undefined> {
  return brands.find((b) => b.slug === slug);
}

export async function getAllProducts(): Promise<Product[]> {
  return products;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  return products.filter((p) => p.category === category);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return products.filter((p) => p.featured).slice(0, limit);
}

export async function getProduct(
  category: string,
  slug: string,
): Promise<Product | undefined> {
  return products.find((p) => p.category === category && p.slug === slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

/** Normalise pour une recherche insensible à la casse et aux accents. */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Recherche plein texte simple (nom, marque, catégorie, points clés).
 * Tous les mots saisis doivent apparaître ; `category` restreint à une catégorie
 * (raccourcis « par marque » des pages catégorie). À remplacer par le full-text Postgres.
 */
export async function searchProducts(query: string, category?: string): Promise<Product[]> {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return products.filter((p) => {
    if (category && p.category !== category) return false;
    const brand = brands.find((b) => b.slug === p.brand)?.name ?? "";
    const categoryName = categories.find((c) => c.slug === p.category)?.name ?? "";
    const haystack = normalize([p.name, brand, categoryName, ...p.highlights, p.summary].join(" "));
    return terms.every((term) => haystack.includes(term));
  });
}

/**
 * Avis clients vérifiés. Aucun avis n'est inventé : tant que la boutique n'en a pas
 * collecté, la liste est vide et la section d'avis ne s'affiche pas.
 */
export async function getVerifiedReviews(limit = 6): Promise<Review[]> {
  const reviews: Review[] = [];
  return reviews.filter((r) => r.verified).slice(0, limit);
}

export interface VariantWithProduct {
  product: Product;
  variant: Variant;
}

/** Recherche une variante par SKU — utilisé pour recalculer le panier côté serveur. */
export async function findVariantsBySku(
  skus: string[],
): Promise<Map<string, VariantWithProduct>> {
  const wanted = new Set(skus);
  const result = new Map<string, VariantWithProduct>();
  for (const product of products) {
    for (const variant of product.variants) {
      if (wanted.has(variant.sku)) result.set(variant.sku, { product, variant });
    }
  }
  return result;
}
