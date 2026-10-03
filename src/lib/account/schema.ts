import { z } from "zod";

/**
 * Données de l'espace client (profil, adresses), stockées dans Supabase
 * (tables `profiles` et `addresses`, protégées par RLS). Ces schémas valident
 * les formulaires côté serveur ; la base applique en plus ses propres contraintes.
 */

/** Numéro togolais : 8 chiffres, avec ou sans indicatif +228, espaces tolérés. */
export function normalizeTogoPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00228")) digits = digits.slice(5);
  else if (digits.startsWith("228") && digits.length === 11) digits = digits.slice(3);
  if (!/^\d{8}$/.test(digits)) return null;
  return `+228 ${digits.match(/\d{2}/g)!.join(" ")}`;
}

const phoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const phone = normalizeTogoPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Numéro à 8 chiffres attendu, par exemple 90 12 34 56." });
      return z.NEVER;
    }
    return phone;
  });

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Indiquez votre prénom.").max(50),
  lastName: z.string().trim().min(1, "Indiquez votre nom.").max(50),
  phone: phoneSchema,
});

export const addressInputSchema = z.object({
  label: z.string().trim().min(1, "Donnez un nom à cette adresse (ex. Domicile).").max(30),
  district: z.string().trim().min(2, "Indiquez le quartier.").max(60),
  city: z.string().trim().min(2, "Indiquez la ville.").max(40),
  landmark: z.string().trim().max(120).default(""),
  phone: phoneSchema,
  isDefault: z.boolean().default(false),
});

export const uuidSchema = z.uuid();

export interface Profile {
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface Address {
  id: string;
  label: string;
  district: string;
  city: string;
  landmark: string;
  phone: string;
  isDefault: boolean;
}

export { MAX_ADDRESSES } from "./limits";

/** Erreurs de validation par champ (premier message de chaque champ). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
