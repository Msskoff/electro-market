/**
 * Chemin de retour après connexion : uniquement un chemin interne
 * (jamais « //domaine », URL absolue ou antislash → pas de redirection ouverte).
 */
export function safeNextPath(value: unknown, fallback = "/compte"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
