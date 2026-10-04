import type { FaqItem } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/utils/format";

/**
 * Configuration modifiable depuis le tableau de bord (table site_settings).
 * Les montants sont en unité mineure de la devise (F CFA).
 * Le nom, l'URL, la langue et la devise restent dans config/site.ts (code).
 */

export interface HeroVideo {
  mp4?: string;
  webm?: string;
  poster?: string;
}

export type HeroTone = "peach" | "sand" | "sky" | "rose" | "lilac";
export const HERO_TONES: HeroTone[] = ["peach", "sand", "sky", "rose", "lilac"];

export interface HeroSlide {
  categorySlug: string;
  productSlug: string;
  /** Teinte d'ambiance de la scène (token de tuile). */
  tone: HeroTone;
  title: string;
  text: string;
  video?: HeroVideo;
}

export interface StorePolicies {
  freeShippingThreshold: number;
  shippingCost: number;
  shippingDays: { min: number; max: number };
  /** Texte affiché : « 24 à 48 h à Lomé ». */
  shippingDelay: string;
  returnDays: number;
  warrantyYears: number;
}

export interface StoreContact {
  email: string;
  phone: string;
  address: { street: string; city: string; region: string; country: string };
}

export interface StoreSettings {
  contact: StoreContact;
  /** Profils de réseaux sociaux (URL complètes), repris dans le schéma Organization. */
  social: string[];
  policies: StorePolicies;
  /** Bandeau « Démo — produits fictifs » en haut du site. */
  demoMode: boolean;
  heroSlides: HeroSlide[];
  /**
   * FAQ générale. Les réponses peuvent contenir des variables remplacées à l'affichage,
   * pour rester à jour quand la configuration change : voir FAQ_VARIABLES.
   */
  faq: FaqItem[];
}

/** Variables utilisables dans les réponses de la FAQ du site. */
export const FAQ_VARIABLES = {
  "{delai_livraison}": "délai de livraison (texte)",
  "{frais_livraison}": "frais de livraison",
  "{seuil_gratuit}": "montant de livraison offerte",
  "{jours_retour}": "jours pour retourner",
  "{garantie_ans}": "années de garantie",
  "{email}": "e-mail de contact",
  "{telephone}": "téléphone",
} as const;

export function renderFaqText(text: string, s: Pick<StoreSettings, "policies" | "contact">): string {
  const values: Record<keyof typeof FAQ_VARIABLES, string> = {
    "{delai_livraison}": s.policies.shippingDelay,
    "{frais_livraison}": formatPrice(s.policies.shippingCost),
    "{seuil_gratuit}": formatPrice(s.policies.freeShippingThreshold),
    "{jours_retour}": String(s.policies.returnDays),
    "{garantie_ans}": String(s.policies.warrantyYears),
    "{email}": s.contact.email,
    "{telephone}": s.contact.phone,
  };
  return text.replace(/\{[a-z_]+\}/g, (m) => (m in values ? values[m as keyof typeof values] : m));
}

/** FAQ du site avec les variables remplacées. */
export function siteFaqItems(s: StoreSettings): FaqItem[] {
  return s.faq.map((f) => ({ question: renderFaqText(f.question, s), answer: renderFaqText(f.answer, s) }));
}

/** Valeurs initiales (reprises du code avant le passage en base) et repli si la base est vide. */
export const DEFAULT_SETTINGS: StoreSettings = {
  contact: {
    email: "contact@votre-domaine.com",
    phone: "+228 00 00 00 00",
    address: { street: "À compléter", city: "Lomé", region: "Maritime", country: "TG" },
  },
  social: [],
  policies: {
    freeShippingThreshold: 50000,
    shippingCost: 2000,
    shippingDays: { min: 1, max: 2 },
    shippingDelay: "24 à 48 h à Lomé",
    returnDays: 30,
    warrantyYears: 2,
  },
  demoMode: false,
  heroSlides: [
    {
      categorySlug: "smartphones",
      productSlug: "aurion-one-5g",
      tone: "sky",
      title: "Lisible, même en plein soleil.",
      text: "Écran OLED 120 Hz de 2 000 nits, capteur 50 Mpx stabilisé et 5 ans de mises à jour annoncées. Le haut de gamme, en format compact.",
    },
    {
      categorySlug: "ordinateurs-portables",
      productSlug: "nuvia-book-14-air",
      tone: "sand",
      title: "1,2 kg. Jusqu'à 15 heures.",
      text: "Un ultraportable 14 pouces 2,8K en aluminium de 14 mm, pensé pour les étudiants et les professionnels nomades.",
    },
    {
      categorySlug: "smartphones",
      productSlug: "kelvo-neo-6a",
      tone: "peach",
      title: "La 5G, sans se ruiner.",
      text: "Grand écran 6,6 pouces à 90 Hz et batterie de 5 000 mAh qui dépasse facilement la journée.",
    },
    {
      categorySlug: "ordinateurs-portables",
      productSlug: "stratos-pro-16",
      tone: "lilac",
      title: "Une station de travail, à emporter.",
      text: "Écran 16 pouces 165 Hz, 32 Go de mémoire et carte graphique dédiée 8 Go pour le montage vidéo, la 3D et le développement.",
    },
  ],
  faq: [
    {
      question: "Quels sont les délais et frais de livraison ?",
      answer: "La livraison prend {delai_livraison}. Elle coûte {frais_livraison} et devient offerte dès {seuil_gratuit} d'achat.",
    },
    {
      question: "Puis-je retourner un produit ?",
      answer: "Oui, vous disposez de {jours_retour} jours après réception pour retourner un produit, sans avoir à vous justifier. Le retour est gratuit.",
    },
    {
      question: "Quelle garantie s'applique à mes achats ?",
      answer: "Tous les produits sont neufs et bénéficient d'une garantie de {garantie_ans} ans.",
    },
    {
      question: "Les produits sont-ils neufs ?",
      answer: "Oui, tous les produits vendus sont neufs, dans leur emballage d'origine scellé.",
    },
  ],
};
