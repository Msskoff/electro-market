import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface AdminContext {
  user: SessionUser;
  firstName: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Garde d'accès de l'administration (pages ET actions) :
 *  - visiteur non connecté → page de connexion, retour ensuite à /admin ;
 *  - client connecté non administrateur → 404 (l'existence de /admin n'est pas révélée).
 * Le droit est vérifié en base (fonction is_admin) ; la RLS le revérifie à chaque écriture.
 */
export const requireAdmin = cache(async (nextPath = "/admin"): Promise<AdminContext> => {
  const user = await getSessionUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(nextPath)}`);
  const supabase = await createClient();
  const [{ data: isAdmin }, { data: profile }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
  ]);
  if (isAdmin !== true) notFound();
  return { user, firstName: profile?.first_name ?? "", supabase };
});

/** Variante pour les Server Actions : renvoie null au lieu de rediriger. */
export async function adminOrNull(): Promise<AdminContext | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin === true ? { user, firstName: "", supabase } : null;
}
