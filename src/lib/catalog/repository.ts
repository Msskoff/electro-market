import "server-only";
import { normalize, queryTerms, relevance } from "./search";
import { brands, categories, products } from "./data";
import { primaryImage } from "./selectors";
import type { Brand, Category, Product, ProductImage, Review, Variant } from "./types";

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

/** Mots courants des acheteurs qui ne figurent pas dans les noms de catégories. */
const CATEGORY_SYNONYMS: Record<string, string> = {
  smartphones: "téléphone portable mobile cellulaire",
  "ordinateurs-portables": "ordi pc laptop notebook",
};

function categoryKeywords(slug: string): string {
  const c = categories.find((cat) => cat.slug === slug);
  return c ? `${c.name} ${c.singular} ${CATEGORY_SYNONYMS[slug] ?? ""}` : "";
}

/** Texte indexé d'un produit : nom, marque, catégorie, points clés (+ résumé si `withSummary`). */
function searchText(p: Product, withSummary = true): string {
  const brand = brands.find((b) => b.slug === p.brand)?.name ?? "";
  return normalize([p.name, brand, categoryKeywords(p.category), ...p.highlights, withSummary ? p.summary : ""].join(" "));
}

/**
 * Recherche plein texte (mêmes règles que les suggestions instantanées, lib/catalog/search.ts) :
 * tous les mots saisis doivent apparaître, résultats triés par pertinence.
 * `category` restreint à une catégorie. À remplacer par le full-text Postgres.
 */
export async function searchProducts(query: string, category?: string): Promise<Product[]> {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];
  return products
    .filter((p) => !category || p.category === category)
    .map((p) => ({ p, score: relevance(normalize(p.name), searchText(p), terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.p);
}

/** Index léger pour les suggestions instantanées (chargé une fois par le navigateur). */
export interface SuggestionIndex {
  products: {
    name: string;
    brand: string;
    url: string;
    price: number;
    from: boolean;
    kind: Product["kind"];
    color: string;
    /** Photo de la miniature (absente : illustration). */
    img?: { src: string; width: number; height: number };
    n: string;
    h: string;
  }[];
  categories: { name: string; url: string; h: string }[];
}

function imageRef(image: ProductImage | undefined) {
  return image && { src: image.src, width: image.width, height: image.height };
}

export async function getSuggestionIndex(): Promise<SuggestionIndex> {
  return {
    products: products.map((p) => {
      const prices = p.variants.map((v) => v.price);
      const min = Math.min(...prices);
      const variant = p.variants.find((v) => v.price === min && v.stock > 0) ?? p.variants[0];
      return {
        name: p.name,
        brand: brands.find((b) => b.slug === p.brand)?.name ?? "",
        url: `/${p.category}/${p.slug}`,
        price: min,
        from: Math.max(...prices) > min,
        kind: p.kind,
        color: variant.color.hex,
        img: imageRef(primaryImage(p, variant)),
        n: normalize(p.name),
        // Suggestions : sans le résumé (index ~4 fois plus léger) ; la page /recherche l'inclut.
        h: searchText(p, false),
      };
    }),
    categories: categories.map((c) => ({ name: c.name, url: `/${c.slug}`, h: normalize(`${categoryKeywords(c.slug)} ${c.tagline}`) })),
  };
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
