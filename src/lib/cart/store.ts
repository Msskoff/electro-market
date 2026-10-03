import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CART_COOKIE, cartSchema, mergeCartLines, parseCart, serializeCart, type CartLine } from "./schema";

/**
 * Stockage du panier.
 *  - Visiteur : cookie de l'appareil (SKU + quantités, sans prix).
 *  - Client connecté : panier du compte (table `carts`, RLS), identique sur tous ses
 *    appareils ; le cookie en est le reflet pour afficher le compteur sans requête.
 */

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function readCartCookie(): Promise<CartLine[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

export async function writeCartCookie(lines: CartLine[]): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, serializeCart(lines), {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Lisible côté client uniquement pour afficher le compteur du panier.
    // Il ne contient aucun prix : les montants sont toujours recalculés côté serveur.
    httpOnly: false,
  });
}

/** Retire le panier de l'appareil (déconnexion, suppression du compte). */
export async function clearCartCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

async function currentUser(): Promise<{ supabase: Supabase; userId: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

/** Panier enregistré dans le compte, ou null si aucun n'existe encore. */
async function loadAccountCart(supabase: Supabase): Promise<CartLine[] | null> {
  const { data } = await supabase.from("carts").select("lines").maybeSingle();
  if (!data) return null;
  const parsed = cartSchema.safeParse(data.lines);
  return parsed.success ? parsed.data : [];
}

async function saveAccountCart(supabase: Supabase, userId: string, lines: CartLine[]): Promise<void> {
  await supabase.from("carts").upsert({ user_id: userId, lines });
}

/** Panier courant : celui du compte si le client est connecté, sinon celui de l'appareil. */
export async function readCurrentCart(): Promise<CartLine[]> {
  const user = await currentUser();
  if (user) {
    const account = await loadAccountCart(user.supabase);
    if (account) return account;
  }
  return readCartCookie();
}

/** Enregistre le panier courant : sur l'appareil, et dans le compte si le client est connecté. */
export async function writeCurrentCart(lines: CartLine[]): Promise<void> {
  await writeCartCookie(lines);
  const user = await currentUser();
  if (user) await saveAccountCart(user.supabase, user.userId, lines);
}

/** Aligne l'appareil sur le panier du compte (autre appareil modifié entre-temps). */
export async function pullAccountCart(): Promise<CartLine[] | null> {
  const user = await currentUser();
  if (!user) return null;
  const account = (await loadAccountCart(user.supabase)) ?? [];
  await writeCartCookie(account);
  return account;
}

/**
 * Juste après une connexion : fusionne le panier de l'appareil dans celui du compte,
 * puis aligne l'appareil. Les articles choisis avant la connexion ne sont jamais perdus.
 */
export async function mergeCartIntoAccount(supabase: Supabase, userId: string): Promise<void> {
  const [account, device] = await Promise.all([loadAccountCart(supabase), readCartCookie()]);
  const merged = mergeCartLines(account ?? [], device);
  await saveAccountCart(supabase, userId, merged);
  await writeCartCookie(merged);
}
