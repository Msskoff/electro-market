import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/config/site";

/** Pages privées ou sans valeur de recherche. */
const PRIVATE_PATHS = [
  "/panier",
  "/commande",
  "/compte",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/auth/",
  "/admin",
  "/api/",
  "/recherche",
];

/**
 * Robots d'assistants IA explicitement autorisés sur le contenu public
 * (CLAUDE.md §7). Modifier cette liste doit être signalé dans la PR.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  // Démo / préproduction : aucun robot ne doit indexer le catalogue fictif.
  if (!siteConfig.indexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
