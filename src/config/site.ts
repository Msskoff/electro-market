/**
 * Configuration centrale de la boutique.
 * Partie FIXE (code) : nom, URL, langue, devise, indexation. La partie modifiable depuis
 * l'administration (contact, politiques commerciales…) est dans lib/settings.
 */
export const siteConfig = {
  name: "ElectroMarket",
  tagline: "L'électronique choisie, testée, expliquée.",
  description:
    "ElectroMarket est une boutique en ligne basée à Lomé (Togo), spécialisée en smartphones et ordinateurs portables, avec fiches techniques détaillées et conseils d'achat.",
  /** URL publique : variable explicite, sinon domaine de production Vercel, sinon local. */
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  ).replace(/\/$/, ""),
  locale: "fr-TG",
  language: "fr",
  /** Code ISO 4217. XOF = franc CFA (UEMOA), sans subdivision. */
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? "XOF",
  /**
   * Indexation par les moteurs et assistants IA. Désactivée par défaut (démo,
   * préproduction) : il faut définir SITE_INDEXING=true au lancement réel.
   */
  indexable: process.env.SITE_INDEXING === "true",
  /** Ville proposée par défaut dans les formulaires d'adresse. */
  defaultCity: "Lomé",
  /*
   * Coordonnées, livraison, retours, garantie, réseaux sociaux, bandeau « Démo », hero et
   * FAQ du site : modifiables dans /admin/configuration (table site_settings, voir
   * lib/settings). Valeurs initiales : DEFAULT_SETTINGS (lib/settings/types.ts).
   */
} as const;

export type SiteConfig = typeof siteConfig;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
