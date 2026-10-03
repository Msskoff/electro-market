import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./redirect";

export interface SessionUser {
  id: string;
  email: string;
}

/** Utilisateur connecté (jeton vérifié par getClaims), ou null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
}

/** Garde d'accès des pages privées : redirige vers la connexion si besoin. */
export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(safeNextPath(nextPath))}`);
  return user;
}
