import { siteConfig } from "@/config/site";

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
});

/** Nombre de décimales de la devise (0 pour XOF, 2 pour EUR). */
const fractionDigits = priceFormatter.resolvedOptions().maximumFractionDigits ?? 0;
const minorPerUnit = 10 ** fractionDigits;

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Formate un montant exprimé dans l'unité mineure de la devise
 * (le franc CFA pour XOF, le centime pour EUR).
 */
export function formatPrice(amount: number): string {
  return priceFormatter.format(amount / minorPerUnit);
}

/**
 * Montant et devise séparés (« 7 350 000 » + « F CFA ») : pour les grands chiffres des
 * tableaux de bord, où l'unité passe à la ligne et s'affiche plus petite.
 */
export function formatPriceParts(amount: number): { value: string; unit: string } {
  const parts = priceFormatter.formatToParts(amount / minorPerUnit);
  const unit = parts.find((p) => p.type === "currency")?.value ?? siteConfig.currency;
  const value = parts
    .filter((p) => p.type !== "currency")
    .map((p) => p.value)
    .join("")
    .trim();
  return { value, unit };
}

/** Valeur décimale attendue par schema.org (« 458500 » en XOF, « 699.00 » en EUR). */
export function toDecimal(amount: number): string {
  return (amount / minorPerUnit).toFixed(fractionDigits);
}

/** Formate une date ISO (AAAA-MM-JJ) de manière déterministe (fuseau UTC). */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
