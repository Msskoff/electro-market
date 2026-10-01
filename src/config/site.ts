/**
 * Configuration centrale de la boutique.
 * Source unique pour le nom, l'URL, les politiques commerciales et l'identité
 * de l'entité (réutilisée par les métadonnées, le JSON-LD et /llms.txt).
 */
export const siteConfig = {
  name: "ElectroMarket",
  tagline: "L'électronique choisie, testée, expliquée.",
  description:
    "ElectroMarket est une boutique en ligne basée à Lomé (Togo), spécialisée en appareils électroniques : smartphones, ordinateurs portables, audio, tablettes et montres connectées, avec fiches techniques détaillées et conseils d'achat.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "fr-TG",
  language: "fr",
  /** Code ISO 4217. XOF = franc CFA (UEMOA), sans subdivision. */
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? "XOF",
  /** Affiche un bandeau signalant que le catalogue contient des données fictives. */
  demoMode: true,
  contact: {
    email: "contact@votre-domaine.com",
    phone: "+228 00 00 00 00",
    address: {
      street: "À compléter",
      city: "Lomé",
      region: "Maritime",
      country: "TG",
    },
  },
  social: [] as string[],
  /** Montants exprimés dans l'unité mineure de la devise (voir lib/utils/format.ts). */
  policies: {
    freeShippingThreshold: 50000, // À VALIDER
    shippingCost: 2000, // À VALIDER
    shippingDays: { min: 1, max: 2 }, // À VALIDER
    shippingDelay: "24 à 48 h à Lomé",
    returnDays: 30, // À VALIDER
    warrantyYears: 2, // À VALIDER
  },
} as const;

export type SiteConfig = typeof siteConfig;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
