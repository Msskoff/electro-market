"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { syncCartFromAccount } from "@/lib/cart/actions";
import {
  getCartCountServerSnapshot,
  getCartCountSnapshot,
  hasAuthSession,
  notifyCartChanged,
  subscribeToCart,
} from "@/lib/cart/client";
import { t } from "@/lib/i18n/fr";

const SYNC_INTERVAL_MS = 15_000;
let lastSync = 0;

/**
 * Client connecté : récupère le panier du compte (il a pu changer sur un autre appareil).
 * Visiteur : aucun appel serveur, les pages restent statiques.
 */
async function syncWithAccount() {
  if (!hasAuthSession() || Date.now() - lastSync < SYNC_INTERVAL_MS) return;
  lastSync = Date.now();
  if (await syncCartFromAccount()) notifyCartChanged();
}

/** Lien panier avec compteur, lu depuis le cookie pour garder les pages statiques. */
export function CartLink() {
  const count = useSyncExternalStore(subscribeToCart, getCartCountSnapshot, getCartCountServerSnapshot);

  useEffect(() => {
    void syncWithAccount();
    const onVisible = () => document.visibilityState === "visible" && void syncWithAccount();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  const label = count > 0 ? `${t.nav.cart} (${count} article${count > 1 ? "s" : ""})` : t.nav.cart;

  return (
    <Link
      href="/panier"
      aria-label={label}
      className="inline-flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
    >
      <span className="relative">
        <Icon name="cart" size={24} />
        {count > 0 && (
          <span
            key={count /* nouvelle valeur = l'animation « bump » rejoue */}
            aria-hidden
            className="bump tabular absolute -right-2 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.6875rem] font-semibold text-on-accent ring-2 ring-bg"
          >
            {count}
          </span>
        )}
      </span>
      <span className="hidden sm:block">{t.nav.cart}</span>
    </Link>
  );
}
