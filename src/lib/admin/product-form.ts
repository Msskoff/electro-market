import type { ProductInput } from "./schemas";
import type { Brand, Category, Product } from "@/lib/catalog/types";

/**
 * Valeurs de départ de l'éditeur de produit. Module neutre (ni client ni serveur) :
 * utilisé par les pages serveur /admin/produits et par l'éditeur.
 */

const today = () => new Date().toISOString().slice(0, 10);

export function emptyProduct(category: Category | undefined, brand: Brand | undefined): ProductInput {
  return {
    id: "",
    slug: "",
    name: "",
    brand: brand?.slug ?? "",
    category: category?.slug ?? "",
    kind: category?.kind ?? "phone",
    summary: "",
    description: [""],
    highlights: [""],
    specs: [{ label: "Écran", specs: [{ label: "Diagonale", value: "" }] }],
    inTheBox: [],
    variants: [{ sku: "", option: "", color: { name: "Noir", hex: "#16181D" }, price: 0, stock: 0, images: [] }],
    faq: [],
    featured: false,
    releasedAt: today(),
  };
}

/** Produit de la base → valeur éditable (le libellé de variante est recalculé à l'enregistrement). */
export function toEditable(p: Product): ProductInput {
  return {
    ...p,
    variants: p.variants.map((v) => ({
      sku: v.sku,
      option: v.option ?? "",
      color: v.color,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      gtin: v.gtin ?? "",
      images: v.images ?? [],
    })),
  };
}
