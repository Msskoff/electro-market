import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { normalize, queryTerms, relevance } from "./search";
import { primaryImage } from "./selectors";
import type { Brand, Category, Product, ProductImage, Review, Variant } from "./types";

/**
 * Couche d'accès au catalogue — SEUL point d'accès aux données produit.
 *
 * Source : base Supabase (tables products, categories, brands), version PUBLIÉE
 * uniquement (les brouillons de l'administration n'apparaissent jamais ici).
 * Le catalogue complet (~450 Ko) est lu en une requête et mis en cache par Next.js
 * (étiquette CATALOG_TAG) : les pages restent statiques, et chaque publication depuis
 * /admin invalide le cache (lib/admin/revalidate.ts).
 */
export const CATALOG_TAG = "catalog";

interface Catalog {
  categories: Category[];
  brands: Brand[];
  products: Product[];
}

const loadCatalog = unstable_cache(
  async (): Promise<Catalog> => {
    const db = createPublicClient();
    const [cats, brs, prods] = await Promise.all([
      db.from("categories").select("data, position").order("position"),
      db.from("brands").select("slug, name").order("name"),
      db.from("products").select("data, in_stock, position").order("position").limit(5000),
    ]);
    const error = cats.error ?? brs.error ?? prods.error;
    if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);
    return {
      categories: (cats.data ?? []).map((c) => c.data as unknown as Category),
      brands: brs.data ?? [],
      // Bascule « Rupture » de l'administration : toutes les variantes passent à 0.
      products: (prods.data ?? []).map((p) => {
        const product = p.data as unknown as Product;
        return p.in_stock ? product : { ...product, variants: product.variants.map((v) => ({ ...v, stock: 0 })) };
      }),
    };
  },
  ["catalog-v1"],
  { tags: [CATALOG_TAG] },
);

export async function getCategories(): Promise<Category[]> {
  return (await loadCatalog()).categories;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return (await loadCatalog()).categories.find((c) => c.slug === slug);
}

export async function getBrands(): Promise<Brand[]> {
  return (await loadCatalog()).brands;
}

export async function getBrand(slug: string): Promise<Brand | undefined> {
  return (await loadCatalog()).brands.find((b) => b.slug === slug);
}

export async function getAllProducts(): Promise<Product[]> {
  return (await loadCatalog()).products;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  return (await loadCatalog()).products.filter((p) => p.category === category);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return (await loadCatalog()).products.filter((p) => p.featured).slice(0, limit);
}

export async function getProduct(category: string, slug: string): Promise<Product | undefined> {
  return (await loadCatalog()).products.find((p) => p.category === category && p.slug === slug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return (await loadCatalog()).products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

/**
 * Ancienne URL d'un produit (slug ou catégorie modifiés depuis l'administration) :
 * nouvelle adresse pour une redirection 301, sinon null.
 */
export async function findProductRedirect(path: string): Promise<string | null> {
  const { data } = await createPublicClient().from("product_redirects").select("to_path").eq("from_path", path).maybeSingle();
  return data?.to_path ?? null;
}

/** Mots courants des acheteurs absents des noms de catégories (repli si la catégorie n'en définit pas). */
const CATEGORY_SYNONYMS: Record<string, string> = {
  smartphones: "téléphone portable mobile cellulaire",
  "ordinateurs-portables": "ordi pc laptop notebook",
};

function categoryKeywords(categories: Category[], slug: string): string {
  const c = categories.find((cat) => cat.slug === slug);
  return c ? `${c.name} ${c.singular} ${c.searchKeywords ?? CATEGORY_SYNONYMS[slug] ?? ""}` : "";
}

/** Texte indexé d'un produit : nom, marque, catégorie, points clés (+ résumé si `withSummary`). */
function searchText(catalog: Catalog, p: Product, withSummary = true): string {
  const brand = catalog.brands.find((b) => b.slug === p.brand)?.name ?? "";
  return normalize(
    [p.name, brand, categoryKeywords(catalog.categories, p.category), ...p.highlights, withSummary ? p.summary : ""].join(" "),
  );
}

/**
 * Recherche plein texte (mêmes règles que les suggestions instantanées, lib/catalog/search.ts) :
 * tous les mots saisis doivent apparaître, résultats triés par pertinence.
 * `category` restreint à une catégorie.
 */
export async function searchProducts(query: string, category?: string): Promise<Product[]> {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];
  const catalog = await loadCatalog();
  return catalog.products
    .filter((p) => !category || p.category === category)
    .map((p) => ({ p, score: relevance(normalize(p.name), searchText(catalog, p), terms) }))
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
  const catalog = await loadCatalog();
  return {
    products: catalog.products.map((p) => {
      const prices = p.variants.map((v) => v.price);
      const min = Math.min(...prices);
      const variant = p.variants.find((v) => v.price === min && v.stock > 0) ?? p.variants[0];
      return {
        name: p.name,
        brand: catalog.brands.find((b) => b.slug === p.brand)?.name ?? "",
        url: `/${p.category}/${p.slug}`,
        price: min,
        from: Math.max(...prices) > min,
        kind: p.kind,
        color: variant.color.hex,
        img: imageRef(primaryImage(p, variant)),
        n: normalize(p.name),
        // Suggestions : sans le résumé (index ~4 fois plus léger) ; la page /recherche l'inclut.
        h: searchText(catalog, p, false),
      };
    }),
    categories: catalog.categories.map((c) => ({
      name: c.name,
      url: `/${c.slug}`,
      h: normalize(`${categoryKeywords(catalog.categories, c.slug)} ${c.tagline}`),
    })),
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
export async function findVariantsBySku(skus: string[]): Promise<Map<string, VariantWithProduct>> {
  const wanted = new Set(skus);
  const result = new Map<string, VariantWithProduct>();
  for (const product of (await loadCatalog()).products) {
    for (const variant of product.variants) {
      if (wanted.has(variant.sku)) result.set(variant.sku, { product, variant });
    }
  }
  return result;
}
