/**
 * Petit « store » côté navigateur pour le compteur du panier.
 * Il lit le cookie (sans prix) afin que les pages restent statiques :
 * aucun rendu serveur n'a besoin de connaître le panier pour afficher l'en-tête.
 */
import { CART_COOKIE, countItems, parseCart } from "./schema";

const EVENT = "vx:cart-change";

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getCartCountSnapshot(): number {
  return countItems(parseCart(readCookie(CART_COOKIE)));
}

export function getCartCountServerSnapshot(): number {
  return 0;
}

export function subscribeToCart(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("focus", callback);
  };
}

export function notifyCartChanged(): void {
  window.dispatchEvent(new Event(EVENT));
}
