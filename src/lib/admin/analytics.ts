import "server-only";
import type { AdminContext } from "./session";

/**
 * Statistiques du tableau de bord (fonction SQL admin_analytics) : audience anonyme +
 * commandes, sur une période et la période précédente de même durée (comparaison).
 */

export const PERIODS = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
] as const;

export type PeriodDays = (typeof PERIODS)[number]["value"];

export interface ProductStat {
  id: string;
  name: string;
  path: string | null;
  views: number;
  adds: number;
  sold: number;
  revenue: number;
}

export interface Analytics {
  days: PeriodDays;
  daily: { day: string; visitors: number; pageviews: number; orders: number; revenue: number }[];
  funnel: { visitors: number; product_viewers: number; adders: number; checkouts: number; orders: number; paid: number };
  totals: {
    visitors: number;
    pageviews: number;
    orders: number;
    revenue: number;
    prev_visitors: number;
    prev_pageviews: number;
    prev_orders: number;
    prev_revenue: number;
  };
  topViewed: ProductStat[];
  topSold: ProductStat[];
  viewedNotBought: ProductStat[];
  sources: { source: string; visitors: number }[];
  devices: { device: "mobile" | "tablet" | "desktop"; visitors: number }[];
  searches: { query: string; count: number; min_results: number }[];
  methods: { method: "moov" | "mixx" | "cod"; orders: number; revenue: number }[];
  statuses: { status: string; count: number }[];
  hours: { dow: number; hour: number; count: number }[];
  pages: { path: string; views: number; visitors: number }[];
}

export function parsePeriod(value: unknown): PeriodDays {
  const n = Number(value);
  return (PERIODS.find((p) => p.value === n)?.value ?? 30) as PeriodDays;
}

export async function getAnalytics(db: AdminContext["supabase"], days: PeriodDays): Promise<Analytics> {
  // Jours entiers (heure de Lomé = UTC) : du début du jour J-(n-1) à maintenant.
  const to = new Date();
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() - (days - 1)));
  const { data, error } = await db.rpc("admin_analytics", { p_from: from.toISOString(), p_to: to.toISOString() });
  if (error) throw new Error(`Statistiques indisponibles : ${error.message}`);
  return { days, ...(data as unknown as Omit<Analytics, "days">) };
}

/** Variation en % par rapport à la période précédente (null si rien à comparer). */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Pourcentage arrondi à 1 décimale (0 si dénominateur nul). */
export function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}
