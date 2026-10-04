"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track, type TrackPayload } from "@/lib/analytics/events";

/**
 * Page vue à chaque navigation (boutique uniquement). La provenance (site d'origine,
 * utm_source) n'est envoyée qu'à la première page : c'est elle qui compte.
 * Aucun cookie, aucun stockage : voir lib/analytics.
 */
export function PageviewTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    track({
      t: "pageview",
      p: pathname,
      ...(isFirst
        ? { r: document.referrer || undefined, u: new URLSearchParams(window.location.search).get("utm_source") ?? undefined }
        : {}),
    });
  }, [pathname]);
  return null;
}

/** Événement ponctuel au premier affichage (fiche produit consultée, recherche effectuée). */
export function TrackEvent(props: Omit<TrackPayload, "p">) {
  const sent = useRef(false);
  const { t, pid, q, n } = props;
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track({ t, pid, q, n });
  }, [t, pid, q, n]);
  return null;
}
