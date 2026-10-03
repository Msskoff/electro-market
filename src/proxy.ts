import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy (ex-middleware, Next.js 16) : rafraîchit la session de connexion.
 * Limité aux pages privées : le catalogue et les fiches produit restent
 * statiques, sans appel au service d'authentification.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/compte/:path*",
    "/commande/:path*",
    "/connexion",
    "/inscription",
    "/mot-de-passe-oublie",
    "/reinitialiser-mot-de-passe",
    "/auth/:path*",
    "/admin/:path*",
  ],
};
