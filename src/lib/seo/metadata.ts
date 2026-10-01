import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface BuildMetadataInput {
  title: string;
  description: string;
  /** Chemin canonique, ex. « /smartphones/aurion-one-5g ». */
  path: string;
  noindex?: boolean;
  type?: "website" | "article";
  /** Titre complet sans suffixe de marque (pour la page d'accueil). */
  absoluteTitle?: boolean;
  /** Image de partage spécifique ; sinon l'image par défaut du site. */
  image?: { url: string; alt: string };
}

const DEFAULT_IMAGE = { url: "/partage.png", width: 1200, height: 630 };

/**
 * Point d'entrée unique pour les métadonnées d'une page :
 * titre, description, canonical, Open Graph, Twitter et robots.
 */
export function buildMetadata({
  title,
  description,
  path,
  noindex = false,
  type = "website",
  absoluteTitle = false,
  image,
}: BuildMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} – ${siteConfig.name}`;
  const images = [image ? { ...image, width: 1200, height: 630 } : { ...DEFAULT_IMAGE, alt: fullTitle }];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: siteConfig.locale.replace("-", "_"),
      type,
      images,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  };
}

/** Tronque proprement une description à la longueur conseillée (155 caractères). */
export function clampDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
