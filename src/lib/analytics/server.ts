import "server-only";
import { createHash } from "node:crypto";
import { after } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { AnalyticsEventType } from "./events";

/**
 * Mesure d'audience anonyme, sans cookie (même principe que Plausible) :
 *  - visiteur = empreinte SHA-256 de (sel secret + jour + IP + navigateur), tronquée ;
 *    le sel change chaque jour : impossible de suivre quelqu'un d'un jour à l'autre
 *    ni de retrouver son adresse IP ;
 *  - aucune IP, aucun identifiant de compte, aucun cookie n'est enregistré ;
 *  - les robots sont ignorés.
 */

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|headless|lighthouse|playwright|pingdom|monitor|curl|wget|python|axios|node-fetch/i;

export function isBot(userAgent: string): boolean {
  return !userAgent || BOT.test(userAgent);
}

export function deviceOf(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Origine lisible d'une visite (paramètre utm_source, sinon site d'où vient le visiteur). */
export function sourceOf(referrer: string | undefined, utmSource: string | undefined, ownHost: string): string {
  const utm = utmSource?.trim().toLowerCase();
  const raw = utm || (() => {
    if (!referrer) return "";
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
      return host === ownHost ? "" : host;
    } catch {
      return "";
    }
  })();
  if (!raw) return "Direct";
  const known: [RegExp, string][] = [
    [/google/, "Google"],
    [/bing/, "Bing"],
    [/whatsapp|wa\.me/, "WhatsApp"],
    [/facebook|fb\.|m\.me/, "Facebook"],
    [/instagram/, "Instagram"],
    [/tiktok/, "TikTok"],
    [/^t\.co$|twitter|^x\.com/, "X (Twitter)"],
    [/linkedin/, "LinkedIn"],
    [/chatgpt|openai/, "ChatGPT"],
    [/perplexity/, "Perplexity"],
    [/claude\.ai|anthropic/, "Claude"],
    [/gemini|bard/, "Gemini"],
    [/yahoo|duckduckgo|ecosia|qwant|yandex/, "Autres moteurs"],
  ];
  return known.find(([re]) => re.test(raw))?.[1] ?? raw.slice(0, 40);
}

function salt(): string {
  // Secret de production (Vercel) ; repli en développement uniquement.
  return process.env.ANALYTICS_SALT ?? "developpement-local";
}

export function visitorId(ip: string, userAgent: string, day = new Date().toISOString().slice(0, 10)): string {
  return createHash("sha256").update(`${salt()}|${day}|${ip}|${userAgent}`).digest("hex").slice(0, 16);
}

/** Contexte de la requête (IP, navigateur) → visiteur anonyme + appareil, ou null pour un robot. */
export function visitorFromHeaders(headers: Headers): { visitor: string; device: "mobile" | "tablet" | "desktop" } | null {
  const ua = headers.get("user-agent") ?? "";
  if (isBot(ua)) return null;
  const ip = (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "0.0.0.0";
  return { visitor: visitorId(ip, ua), device: deviceOf(ua) };
}

export interface EventRow {
  type: AnalyticsEventType;
  visitor: string;
  device: "mobile" | "tablet" | "desktop";
  path?: string;
  product_id?: string | null;
  query?: string | null;
  results?: number | null;
  source?: string;
  value?: number | null;
}

/** Enregistre un événement. Ne lève jamais d'erreur : la mesure ne doit pas gêner la vente. */
/**
 * Mesure active uniquement sur le site déployé : jamais en développement, ni quand
 * ANALYTICS_DISABLED=1 (machine locale, tests) — les statistiques restent celles du vrai site.
 */
export function analyticsEnabled(): boolean {
  return process.env.NODE_ENV !== "development" && process.env.ANALYTICS_DISABLED !== "1";
}

export async function recordEvent(row: EventRow): Promise<void> {
  if (!analyticsEnabled()) return;
  try {
    await createPublicClient().from("analytics_events").insert(row);
  } catch {
    // ignoré
  }
}

/**
 * Depuis une Server Action : enregistre l'événement APRÈS la réponse (aucune attente
 * pour le client). Le chemin est celui de la page d'où vient l'action (en-tête Referer).
 */
export function recordFromRequest(headers: Headers, row: Omit<EventRow, "visitor" | "device" | "path"> & { path?: string }): void {
  const who = visitorFromHeaders(headers);
  if (!who) return;
  let path = row.path ?? "";
  if (!path) {
    try {
      path = new URL(headers.get("referer") ?? "").pathname.slice(0, 200);
    } catch {
      path = "";
    }
  }
  after(() => recordEvent({ ...row, ...who, path }));
}
