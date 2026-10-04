import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentMethodId } from "./status";

/**
 * Lectures des commandes avec la session de l'utilisateur : la RLS limite un client à
 * ses commandes ; l'administrateur les voit toutes.
 */

type Db = Awaited<ReturnType<typeof createClient>>;

export interface OrderItem {
  position: number;
  product_id: string;
  sku: string;
  name: string;
  variant_label: string;
  unit_price: number;
  qty: number;
}

export interface OrderProof {
  id: string;
  file_path: string;
  reference: string;
  amount: number;
  paid_at: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  /** Lien temporaire (10 min) vers le fichier privé. */
  url?: string | null;
}

export interface OrderEvent {
  id: number;
  status: string;
  note: string;
  by_admin: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  number: string;
  user_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethodId;
  payment_snapshot: { label?: string; number?: string; accountName?: string; instructions?: string };
  subtotal: number;
  shipping: number;
  total: number;
  customer: { first_name: string; last_name: string; email: string; phone: string };
  address: { label: string; district: string; city: string; landmark: string; phone: string };
  note: string;
  customer_message: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  payment_proofs: OrderProof[];
  order_events: OrderEvent[];
}

export interface OrderSummary {
  id: string;
  number: string;
  status: OrderStatus;
  payment_method: PaymentMethodId;
  total: number;
  created_at: string;
  updated_at: string;
  customer: Order["customer"];
  itemCount: number;
}

const FULL = "*, order_items(*), payment_proofs(*), order_events(*)";
const SUMMARY = "id, number, status, payment_method, total, created_at, updated_at, customer, order_items(qty)";

function toSummary(row: Record<string, unknown>): OrderSummary {
  const items = (row.order_items as { qty: number }[] | null) ?? [];
  return { ...(row as unknown as OrderSummary), itemCount: items.reduce((s, i) => s + i.qty, 0) };
}

function sortOrder(o: Order): Order {
  return {
    ...o,
    order_items: [...o.order_items].sort((a, b) => a.position - b.position),
    payment_proofs: [...o.payment_proofs].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    order_events: [...o.order_events].sort((a, b) => a.id - b.id),
  };
}

// ------------------------------------------------------------------ Client

export async function listMyOrders(): Promise<OrderSummary[]> {
  const db = await createClient();
  const { data: claims } = await db.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return [];
  const { data } = await db.from("orders").select(SUMMARY).eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
  return (data ?? []).map((r) => toSummary(r as Record<string, unknown>));
}

export async function getMyOrder(number: string): Promise<Order | null> {
  const db = await createClient();
  const { data: claims } = await db.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;
  const { data } = await db.from("orders").select(FULL).eq("number", number).eq("user_id", uid).maybeSingle();
  return data ? sortOrder(data as unknown as Order) : null;
}

// ------------------------------------------------------------------ Administration

export async function listOrdersForAdmin(db: Db, status?: OrderStatus): Promise<{ orders: OrderSummary[]; counts: Record<string, number> }> {
  let query = db.from("orders").select(SUMMARY).order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  const [list, all] = await Promise.all([query, db.from("orders").select("status")]);
  const counts: Record<string, number> = {};
  for (const r of all.data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return { orders: (list.data ?? []).map((r) => toSummary(r as Record<string, unknown>)), counts };
}

export async function getOrderForAdmin(db: Db, number: string): Promise<Order | null> {
  const { data } = await db.from("orders").select(FULL).eq("number", number).maybeSingle();
  if (!data) return null;
  const order = sortOrder(data as unknown as Order);
  const storage = db.storage.from("preuves");
  order.payment_proofs = await Promise.all(
    order.payment_proofs.map(async (p) => ({ ...p, url: (await storage.createSignedUrl(p.file_path, 600)).data?.signedUrl ?? null })),
  );
  return order;
}

/** Résumé des ventes pour le tableau de bord. */
export async function getSalesOverview(db: Db) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [recent, pending] = await Promise.all([
    db.from("orders").select("total, status, created_at").gte("created_at", since),
    db.from("orders").select(SUMMARY).in("status", ["payment_review", "to_ship", "awaiting_payment"]).order("created_at").limit(8),
  ]);
  const valid = (recent.data ?? []).filter((o) => o.status !== "cancelled");
  return {
    orders30: valid.length,
    revenue30: valid.reduce((s, o) => s + o.total, 0),
    toProcess: (pending.data ?? []).map((r) => toSummary(r as Record<string, unknown>)),
  };
}
