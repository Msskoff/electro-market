import { z } from "zod";
import { siteConfig } from "@/config/site";
import { analyticsEnabled, recordEvent, sourceOf, visitorFromHeaders } from "@/lib/analytics/server";

/**
 * Réception des événements d'audience (pages vues, fiches produit, ajouts au panier,
 * recherches). Anonyme, sans cookie : voir lib/analytics/server.ts.
 * Répond toujours 204 (rien à renvoyer au navigateur, aucune information divulguée).
 */

const schema = z.object({
  t: z.enum(["pageview", "product_view", "add_to_cart", "search"]),
  p: z.string().max(200).regex(/^\//),
  pid: z.string().max(80).regex(/^[a-z0-9-]+$/).optional(),
  q: z.string().trim().max(80).optional(),
  n: z.number().int().min(0).max(100000).optional(),
  r: z.string().max(500).optional(),
  u: z.string().max(40).optional(),
});

// Limitation de débit simple, par instance : 60 événements par minute et par visiteur.
const hits = new Map<string, { count: number; reset: number }>();
function limited(visitor: string): boolean {
  const now = Date.now();
  const entry = hits.get(visitor);
  if (!entry || entry.reset < now) {
    if (hits.size > 10_000) hits.clear();
    hits.set(visitor, { count: 1, reset: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 60;
}

const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  if (!analyticsEnabled()) return noContent();
  const who = visitorFromHeaders(request.headers);
  if (!who || limited(who.visitor)) return noContent();

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return noContent();
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return noContent();
  const e = parsed.data;
  // Les pages privées et l'administration ne sont pas mesurées.
  if (/^\/(admin|api|auth)(\/|$)/.test(e.p)) return noContent();

  await recordEvent({
    type: e.t,
    visitor: who.visitor,
    device: who.device,
    path: e.p,
    product_id: e.pid ?? null,
    query: e.t === "search" ? (e.q ?? "").toLowerCase() : null,
    results: e.t === "search" ? (e.n ?? 0) : null,
    source: sourceOf(e.r, e.u, new URL(siteConfig.url).hostname.replace(/^www\./, "")),
  });
  return noContent();
}
