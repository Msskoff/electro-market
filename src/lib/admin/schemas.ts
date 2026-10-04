import { z } from "zod";
import { MAX_LINES, SKU_PATTERN } from "@/lib/cart/lines";
import { HERO_TONES } from "@/lib/settings/types";

/**
 * Validation serveur de TOUT ce qui arrive de l'administration (jamais de confiance
 * dans le navigateur). Les messages sont affichés tels quels à l'administrateur.
 */

export const slugSchema = z
  .string()
  .trim()
  .min(2, "2 caractères minimum.")
  .max(80, "80 caractères maximum.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Minuscules, chiffres et tirets uniquement (ex. « aurion-one-5g »).");

const text = (min: number, max: number, label = "Ce champ") =>
  z
    .string()
    .trim()
    .min(min, min <= 1 ? `${label} est obligatoire.` : `${min} caractères minimum.`)
    .max(max, `${max} caractères maximum.`);

const optionalText = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`).optional().transform((v) => v || undefined);

const faqSchema = z.array(z.object({ question: text(5, 200, "La question"), answer: text(5, 1200, "La réponse") })).max(20);

export const productImageSchema = z.object({
  src: z
    .string()
    .trim()
    .refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Adresse d'image invalide."),
  alt: text(3, 160, "Le texte alternatif"),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  blurDataURL: z.string().startsWith("data:image/").max(3000).optional(),
});

const priceSchema = z.number({ message: "Prix invalide." }).int("Prix en francs CFA entiers.").min(1, "Prix obligatoire.").max(100_000_000);

export const variantSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, "Référence obligatoire.")
      .max(64)
      .regex(SKU_PATTERN, "Majuscules, chiffres et tirets (ex. AUR-ONE-128-GRA)."),
    option: optionalText(40),
    color: z.object({
      name: text(1, 40, "La couleur"),
      hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur au format #RRGGBB."),
    }),
    price: priceSchema,
    compareAtPrice: z.number().int().positive().optional(),
    stock: z.number({ message: "Stock invalide." }).int().min(0, "Stock positif ou nul.").max(100000),
    gtin: z
      .string()
      .trim()
      .regex(/^\d{8,14}$/, "GTIN : 8 à 14 chiffres.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    images: z.array(productImageSchema).max(8, "8 photos maximum par variante.").optional(),
  })
  .refine((v) => v.compareAtPrice === undefined || v.compareAtPrice > v.price, {
    path: ["compareAtPrice"],
    message: "Le prix barré doit être supérieur au prix.",
  })
  // Libellé affiché (« 256 Go · Graphite ») : toujours déduit, jamais saisi à la main.
  .transform((v) => ({ ...v, label: v.option ? `${v.option} · ${v.color.name}` : v.color.name }));

export const productSchema = z
  .object({
    id: slugSchema,
    slug: slugSchema,
    name: text(2, 80, "Le nom"),
    brand: slugSchema,
    category: slugSchema,
    kind: z.enum(["phone", "laptop"]),
    summary: text(40, 400, "Le résumé"),
    description: z.array(text(1, 1500, "Le paragraphe")).min(1, "Au moins un paragraphe de description.").max(8),
    highlights: z.array(text(1, 30, "La caractéristique")).min(1, "Au moins une caractéristique clé.").max(3, "3 caractéristiques clés maximum."),
    specs: z
      .array(
        z.object({
          label: text(1, 40, "Le groupe"),
          specs: z.array(z.object({ label: text(1, 60, "Le libellé"), value: text(1, 200, "La valeur") })).min(1).max(30),
        }),
      )
      .max(15),
    inTheBox: z.array(text(1, 80, "L'élément")).max(20),
    variants: z.array(variantSchema).min(1, "Au moins une variante.").max(MAX_LINES),
    faq: faqSchema,
    mpn: optionalText(60),
    featured: z.boolean().optional(),
    releasedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ."),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .superRefine((p, ctx) => {
    const seen = new Set<string>();
    p.variants.forEach((v, i) => {
      if (seen.has(v.sku)) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "Référence en double." });
      seen.add(v.sku);
    });
  });

export type ProductInput = z.input<typeof productSchema>;

export const categorySchema = z.object({
  slug: slugSchema,
  name: text(2, 60, "Le nom"),
  singular: text(2, 60, "Le nom au singulier"),
  kind: z.enum(["phone", "laptop"]),
  tagline: text(2, 80, "L'accroche"),
  intro: text(40, 800, "L'introduction"),
  searchKeywords: optionalText(300),
  faq: faqSchema,
});

export const brandSchema = z.object({ slug: slugSchema, name: text(1, 60, "Le nom") });

const heroSlideSchema = z.object({
  categorySlug: slugSchema,
  productSlug: slugSchema,
  tone: z.enum(HERO_TONES as [string, ...string[]]),
  title: text(3, 80, "Le titre"),
  text: text(10, 300, "Le texte"),
  video: z
    .object({ mp4: optionalText(300), webm: optionalText(300), poster: optionalText(300) })
    .optional(),
});

export const settingsSchema = z.object({
  contact: z.object({
    email: z.email("Adresse e-mail invalide."),
    phone: text(6, 30, "Le téléphone"),
    address: z.object({
      street: text(1, 120, "L'adresse"),
      city: text(1, 60, "La ville"),
      region: text(1, 60, "La région"),
      country: z.string().trim().regex(/^[A-Z]{2}$/, "Code pays sur 2 lettres (TG)."),
    }),
  }),
  social: z.array(z.url("Adresse invalide (https://…).")).max(10),
  policies: z
    .object({
      freeShippingThreshold: z.number().int().min(0),
      shippingCost: z.number().int().min(0),
      shippingDays: z.object({ min: z.number().int().min(0).max(60), max: z.number().int().min(0).max(60) }),
      shippingDelay: text(3, 60, "Le délai"),
      returnDays: z.number().int().min(0).max(365),
      warrantyYears: z.number().int().min(0).max(10),
    })
    .refine((p) => p.shippingDays.max >= p.shippingDays.min, {
      path: ["shippingDays", "max"],
      message: "Le délai maximum doit être supérieur ou égal au minimum.",
    }),
  demoMode: z.boolean(),
  heroSlides: z.array(heroSlideSchema).min(1, "Au moins une diapositive.").max(8),
  faq: faqSchema,
});

/** Erreurs Zod → { "variants.0.price": "message" } (affichées à côté des champs). */
export function issuesToErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export { slugify } from "@/lib/utils/slug";
