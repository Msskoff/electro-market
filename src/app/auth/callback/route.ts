import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { mergeCartIntoAccount } from "@/lib/cart/store";
import { createClient } from "@/lib/supabase/server";

/**
 * Retour des liens envoyés par e-mail (activation du compte, mot de passe oublié) :
 * échange du code à usage unique (PKCE) contre une session, puis redirection
 * vers une page interne uniquement.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("suite"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await mergeCartIntoAccount(supabase, data.user.id);
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Lien expiré, déjà utilisé, ou ouvert dans un autre navigateur.
  return NextResponse.redirect(new URL("/connexion?erreur=lien", origin));
}
