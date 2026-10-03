/**
 * Modèle de domaine du catalogue.
 * Les prix sont TOUJOURS stockés en entiers, dans l'unité mineure de la devise (F CFA pour XOF), pour éviter les erreurs d'arrondi.
 */

/** Types d'appareils vendus : smartphones et ordinateurs portables uniquement. */
export type DeviceKind = "phone" | "laptop";

export interface Category {
  slug: string;
  name: string;
  /** Nom au singulier pour les phrases (« un smartphone »). */
  singular: string;
  kind: DeviceKind;
  /** Accroche courte affichée sur les cartes. */
  tagline: string;
  /** Introduction SEO de la page catégorie (2–3 phrases factuelles). */
  intro: string;
  faq: FaqItem[];
}

export interface Brand {
  slug: string;
  name: string;
}

export interface Spec {
  label: string;
  value: string;
}

export interface SpecGroup {
  label: string;
  specs: Spec[];
}

/**
 * Photo produit. Dimensions RÉELLES du fichier source (évitent tout décalage de mise en
 * page) et miniature floue facultative affichée pendant le chargement.
 * Générer ces valeurs avec `npm run image:info -- <fichier>`.
 */
export interface ProductImage {
  /** Chemin local (/produits/…) ou URL du stockage Supabase (bucket public). */
  src: string;
  /** Texte alternatif descriptif : « Smartphone X noir, vue de face ». */
  alt: string;
  width: number;
  height: number;
  /** Miniature floue en data URL (~200 octets), affichée instantanément. */
  blurDataURL?: string;
}

export interface Variant {
  sku: string;
  /** Photos de la variante (la première est le visuel principal). Sans photo : illustration. */
  images?: ProductImage[];
  /** Libellé lisible, ex. « 256 Go · Graphite ». */
  label: string;
  color: { name: string; hex: string };
  /** Attribut de capacité / configuration (facultatif). */
  option?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  gtin?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: Brand["slug"];
  category: Category["slug"];
  /** Type d'appareil (pilote l'illustration de remplacement). */
  kind: DeviceKind;
  /** Résumé factuel de 2–3 phrases : ce que c'est, pour qui, point fort. */
  summary: string;
  description: string[];
  /** 2–3 caractéristiques clés affichées en micro-étiquettes. */
  highlights: string[];
  specs: SpecGroup[];
  inTheBox: string[];
  variants: Variant[];
  faq: FaqItem[];
  mpn?: string;
  featured?: boolean;
  releasedAt: string;
  updatedAt: string;
}

export type StockState = "in_stock" | "low_stock" | "out_of_stock";

export const LOW_STOCK_THRESHOLD = 5;

export function stockState(stock: number): StockState {
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

/** Avis client. Seuls les avis vérifiés (achat confirmé) sont publiés. */
export interface Review {
  id: string;
  productId: Product["id"];
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  verified: boolean;
  publishedAt: string;
}
