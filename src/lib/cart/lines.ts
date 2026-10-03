/**
 * Logique pure du panier, SANS dépendance : importable côté navigateur (compteur de
 * l'en-tête) sans embarquer Zod (~90 Ko compressés). Les schémas Zod des Server
 * Actions sont dans schema.ts et réutilisent ces constantes.
 *
 * Le panier est stocké dans un cookie sous forme minimale : SKU + quantité.
 * Les prix n'y figurent JAMAIS : ils sont recalculés côté serveur à partir du catalogue.
 */
export const CART_COOKIE = "vx_cart";
export const MAX_QTY_PER_LINE = 10;
export const MAX_LINES = 30;
export const SKU_PATTERN = /^[A-Z0-9-]+$/;
export const SKU_MAX_LENGTH = 64;

// `type` (et non `interface`) : sérialisable tel quel dans la colonne JSON `carts.lines`.
export type CartLine = { sku: string; qty: number };

/** Valide une ligne (mêmes règles que `cartLineSchema`) ; null si invalide. */
function toLine(value: unknown): CartLine | null {
  if (typeof value !== "object" || value === null) return null;
  const { sku, qty } = value as Record<string, unknown>;
  if (typeof sku !== "string" || typeof qty !== "number") return null;
  const s = sku.trim();
  if (s.length < 1 || s.length > SKU_MAX_LENGTH || !SKU_PATTERN.test(s)) return null;
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) return null;
  return { sku: s, qty };
}

/** Valide un panier complet ; null si une seule ligne est invalide. */
export function validateCart(value: unknown): CartLine[] | null {
  if (!Array.isArray(value) || value.length > MAX_LINES) return null;
  const lines: CartLine[] = [];
  for (const item of value) {
    const line = toLine(item);
    if (!line) return null;
    lines.push(line);
  }
  return lines;
}

/** Lit le cookie de façon tolérante : toute donnée invalide donne un panier vide. */
export function parseCart(raw: string | undefined | null): CartLine[] {
  if (!raw) return [];
  try {
    return validateCart(JSON.parse(raw)) ?? [];
  } catch {
    return [];
  }
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(lines);
}

/** Ajoute une quantité à une ligne (ou la crée), plafonnée à MAX_QTY_PER_LINE. */
export function addLine(lines: CartLine[], sku: string, qty: number): CartLine[] {
  const existing = lines.find((l) => l.sku === sku);
  if (existing) {
    return lines.map((l) =>
      l.sku === sku ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY_PER_LINE) } : l,
    );
  }
  if (lines.length >= MAX_LINES) return lines;
  return [...lines, { sku, qty: Math.min(qty, MAX_QTY_PER_LINE) }];
}

/** Fixe la quantité d'une ligne ; 0 supprime la ligne. */
export function setLineQty(lines: CartLine[], sku: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.sku !== sku);
  return lines.map((l) => (l.sku === sku ? { ...l, qty: Math.min(qty, MAX_QTY_PER_LINE) } : l));
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

/**
 * Fusion à la connexion : le panier du compte d'abord, puis les articles ajoutés sur
 * l'appareil avant la connexion. Pour un même SKU, on garde la plus grande quantité
 * (pas d'addition : évite de doubler un article déjà synchronisé).
 */
export function mergeCartLines(account: CartLine[], device: CartLine[]): CartLine[] {
  const merged = account.map((l) => ({ ...l }));
  for (const line of device) {
    const existing = merged.find((l) => l.sku === line.sku);
    if (existing) existing.qty = Math.min(Math.max(existing.qty, line.qty), MAX_QTY_PER_LINE);
    else if (merged.length < MAX_LINES) merged.push({ sku: line.sku, qty: Math.min(line.qty, MAX_QTY_PER_LINE) });
  }
  return merged;
}
