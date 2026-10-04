/**
 * Événements d'audience envoyés par le navigateur (module minuscule, sans dépendance).
 * Envoi par navigator.sendBeacon : ne ralentit jamais la page, même à la fermeture.
 * Aucune donnée personnelle : le serveur calcule un identifiant anonyme du jour.
 */

export type AnalyticsEventType = "pageview" | "product_view" | "add_to_cart" | "search" | "order";

export interface TrackPayload {
  t: Exclude<AnalyticsEventType, "order">;
  /** Chemin de la page, sans paramètres. */
  p: string;
  /** Produit concerné. */
  pid?: string;
  /** Recherche tapée et nombre de résultats. */
  q?: string;
  n?: number;
  /** Page d'où vient le visiteur (première page vue uniquement) et utm_source. */
  r?: string;
  u?: string;
}

export const TRACK_ENDPOINT = "/api/evenement";

export function track(payload: Omit<TrackPayload, "p"> & { p?: string }): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ p: window.location.pathname, ...payload });
    if (navigator.sendBeacon?.(TRACK_ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    void fetch(TRACK_ENDPOINT, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
  } catch {
    // La mesure ne doit jamais gêner la navigation.
  }
}
