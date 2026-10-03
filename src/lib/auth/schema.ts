import { z } from "zod";

/** E-mail normalisé (espaces retirés, minuscules). */
export const emailSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.email("Adresse e-mail invalide."),
);

/** 8 caractères minimum ; 72 maximum (limite de l'algorithme de hachage bcrypt). */
export const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum.")
  .max(72, "72 caractères maximum.");

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "Indiquez votre prénom.").max(50),
  lastName: z.string().trim().min(1, "Indiquez votre nom.").max(50),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas." });

/** État renvoyé par les actions de formulaire (useActionState). */
export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Valeurs à réafficher après une erreur (jamais les mots de passe). */
  values?: Record<string, string>;
}

/**
 * Messages Supabase → français. Volontairement vagues pour ne jamais révéler
 * si une adresse e-mail possède un compte.
 */
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou mot de passe incorrect.";
    case "email_not_confirmed":
      return "Confirmez d'abord votre adresse e-mail grâce au lien reçu par e-mail.";
    case "weak_password":
      return "Mot de passe trop faible : choisissez-en un plus long ou moins courant.";
    case "same_password":
      return "Le nouveau mot de passe doit être différent de l'ancien.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Trop de tentatives. Réessayez dans quelques minutes.";
    case "signup_disabled":
      return "Les inscriptions sont momentanément fermées.";
    default:
      return "Une erreur est survenue. Réessayez dans un instant.";
  }
}
