import { z } from "zod";

/**
 * Données de l'espace client.
 *
 * MVP : aucun compte serveur n'existe encore (Supabase Auth prévu). Ces données sont
 * enregistrées sur l'appareil du client (voir store.ts). Les schémas sont ceux qui
 * serviront tels quels à valider les données côté serveur une fois l'authentification branchée.
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
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.union([z.literal(""), z.email("Adresse e-mail invalide.")]),
  ),
});

export const addressSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "Donnez un nom à cette adresse (ex. Domicile).").max(30),
  district: z.string().trim().min(2, "Indiquez le quartier.").max(60),
  city: z.string().trim().min(2, "Indiquez la ville.").max(40),
  landmark: z.string().trim().max(120).default(""),
  phone: phoneSchema,
  isDefault: z.boolean().default(false),
});

export const accountSchema = z.object({
  version: z.literal(1),
  profile: profileSchema.nullable(),
  addresses: z.array(addressSchema).max(10),
});

export type Profile = z.infer<typeof profileSchema>;
export type Address = z.infer<typeof addressSchema>;
export type AccountData = z.infer<typeof accountSchema>;

export const EMPTY_ACCOUNT: AccountData = { version: 1, profile: null, addresses: [] };

/** Lecture tolérante : toute donnée absente ou corrompue donne un compte vide. */
export function parseAccount(raw: string | null | undefined): AccountData {
  if (!raw) return EMPTY_ACCOUNT;
  try {
    const result = accountSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : EMPTY_ACCOUNT;
  } catch {
    return EMPTY_ACCOUNT;
  }
}

/** Erreurs de validation par champ (premier message de chaque champ). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
