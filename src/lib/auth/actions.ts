"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { absoluteUrl } from "@/config/site";
import { fieldErrors } from "@/lib/account/schema";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./redirect";
import {
  authErrorMessage,
  newPasswordSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  type FormState,
} from "./schema";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

/** Lien de retour des e-mails (confirmation, mot de passe oublié) : échange de code PKCE. */
const callbackUrl = (next: string) => absoluteUrl(`/auth/callback?suite=${encodeURIComponent(next)}`);

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { firstName: text(formData, "firstName"), lastName: text(formData, "lastName"), email: text(formData, "email") };
  const parsed = signUpSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { firstName, lastName, email, password } = parsed.data;
  const next = safeNextPath(formData.get("suite"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl(next),
      data: { first_name: firstName, last_name: lastName },
    },
  });
  if (error) return { message: authErrorMessage(error.code), values };

  // Confirmation d'e-mail désactivée : la session est ouverte immédiatement.
  if (data.session) redirect(next);
  return {
    ok: true,
    message:
      next === "/commande"
        ? `Presque fini ! Un e-mail vient d'être envoyé à ${email} : cliquez sur le lien qu'il contient pour activer votre compte. Vous reviendrez directement à votre commande, votre panier est conservé.`
        : `Presque fini ! Un e-mail vient d'être envoyé à ${email} : cliquez sur le lien qu'il contient pour activer votre compte.`,
  };
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: authErrorMessage(error.code), values };

  revalidatePath("/compte");
  redirect(safeNextPath(formData.get("suite")));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/compte");
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = resetRequestSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/reinitialiser-mot-de-passe"),
  });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { message: authErrorMessage(error.code), values };
  }
  // Même réponse que le compte existe ou non (pas de divulgation).
  return {
    ok: true,
    message: "Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d'être envoyé.",
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: text(formData, "password"), confirm: text(formData, "confirm") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { message: "Le lien a expiré. Refaites une demande de réinitialisation." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: authErrorMessage(error.code) };

  revalidatePath("/compte");
  redirect("/compte?mot-de-passe=modifie");
}

/** Droit à l'effacement : supprime le compte, le profil et les adresses (cascade en base). */
export async function deleteAccount(): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { message: "La suppression a échoué. Réessayez ou contactez-nous." };
  await supabase.auth.signOut();
  revalidatePath("/compte");
  redirect("/?compte=supprime");
}
