/**
 * Statuts de commande : libellés et règles partagés (client, administration, tests).
 * Module neutre, sans dépendance : importable côté navigateur.
 * Les transitions réellement autorisées sont vérifiées en base (admin_update_order).
 */

export type OrderStatus = "awaiting_payment" | "payment_review" | "to_ship" | "shipped" | "delivered" | "cancelled";
export type PaymentMethodId = "moov" | "mixx" | "cod";

export const ORDER_STATUSES: OrderStatus[] = ["awaiting_payment", "payment_review", "to_ship", "shipped", "delivered", "cancelled"];

/** Libellé vu par le client. */
export const customerStatusLabel: Record<OrderStatus, string> = {
  awaiting_payment: "En attente de paiement",
  payment_review: "Paiement en cours de vérification",
  to_ship: "Confirmée, en préparation",
  shipped: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

/** Libellé vu par l'administrateur (ce qu'il doit faire). */
export const adminStatusLabel: Record<OrderStatus, string> = {
  awaiting_payment: "Attend le paiement",
  payment_review: "Preuve à vérifier",
  to_ship: "À expédier",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export type StatusTone = "neutral" | "info" | "warn" | "success" | "danger";

export const statusTone: Record<OrderStatus, StatusTone> = {
  awaiting_payment: "warn",
  payment_review: "info",
  to_ship: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

export const paymentMethodShort: Record<PaymentMethodId, string> = {
  moov: "Moov Money",
  mixx: "Mixx by Yas",
  cod: "À la livraison",
};

export function isMobileMoney(method: string): method is "moov" | "mixx" {
  return method === "moov" || method === "mixx";
}

/** Actions proposées à l'administrateur selon le statut (mêmes règles que la base). */
export function adminNextActions(status: OrderStatus, method: PaymentMethodId): { status: OrderStatus; label: string; needsMessage?: boolean; danger?: boolean }[] {
  const cancel = { status: "cancelled" as const, label: "Annuler la commande (stock rendu)", danger: true, needsMessage: true };
  switch (status) {
    case "awaiting_payment":
      return [{ status: "to_ship", label: "Paiement reçu (sans preuve)" }, cancel];
    case "payment_review":
      return [
        { status: "to_ship", label: "Paiement vérifié : valider" },
        { status: "awaiting_payment", label: "Refuser la preuve", needsMessage: true, danger: true },
        cancel,
      ];
    case "to_ship":
      return [{ status: "shipped", label: "Marquer comme expédiée" }, { status: "delivered", label: method === "cod" ? "Livrée et payée" : "Marquer comme livrée" }, cancel];
    case "shipped":
      return [{ status: "delivered", label: method === "cod" ? "Livrée et payée" : "Marquer comme livrée" }, cancel];
    default:
      return [];
  }
}

/** Le client peut annuler lui-même tant que rien n'est payé ni expédié. */
export function customerCanCancel(status: OrderStatus, method: string): boolean {
  return status === "awaiting_payment" || (status === "to_ship" && method === "cod");
}

/** Étapes de suivi affichées au client. */
export function trackingSteps(method: string): { key: OrderStatus[]; label: string }[] {
  return [
    { key: ["awaiting_payment", "payment_review"], label: isMobileMoney(method) ? "Paiement" : "Commande reçue" },
    { key: ["to_ship"], label: "Préparation" },
    { key: ["shipped"], label: "Livraison" },
    { key: ["delivered"], label: "Livrée" },
  ];
}
