"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminUpdateOrder } from "@/lib/orders/actions";
import { adminNextActions, type OrderStatus, type PaymentMethodId } from "@/lib/orders/status";
import { cn } from "@/lib/utils/cn";

/**
 * Boutons de suivi d'une commande. Chaque action est confirmée, son résultat affiché
 * (role="status"), et la page se recharge sur le nouvel état.
 */
export function OrderActions({ orderId, status, method }: { orderId: string; status: OrderStatus; method: PaymentMethodId }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [asking, setAsking] = useState<OrderStatus | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const actions = adminNextActions(status, method);

  if (actions.length === 0) return <p className="text-sm text-muted">Aucune action possible : commande {status === "delivered" ? "livrée" : "annulée"}.</p>;

  const run = (next: OrderStatus, label: string) =>
    startTransition(async () => {
      setFeedback({ ok: true, text: "Enregistrement…" });
      const result = await adminUpdateOrder({ orderId, status: next, message });
      if (!result.ok) return setFeedback({ ok: false, text: result.error });
      setFeedback({ ok: true, text: `${label} : enregistré. Le client voit le nouveau statut.` });
      setMessage("");
      setAsking(null);
      router.refresh();
    });

  const pendingAction = actions.find((a) => a.status === asking);

  return (
    <div className="flex flex-col gap-3">
      {pendingAction ? (
        <div className="rounded-lg border border-border p-4">
          <label htmlFor="message-client" className="block text-sm font-semibold">
            Message au client {pendingAction.status === "cancelled" && <span className="font-normal text-muted">(facultatif)</span>}
          </label>
          <textarea
            id="message-client"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={pendingAction.status === "awaiting_payment" ? "Ex. : le montant reçu (100 000 F) ne correspond pas au total. Merci de compléter." : "Ex. : produit indisponible, nous vous recontactons."}
            className="mt-1.5 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || (pendingAction.status === "awaiting_payment" && !message.trim())}
              onClick={() => run(pendingAction.status, pendingAction.label)}
              className="inline-flex h-11 items-center rounded-full bg-danger px-5 text-sm font-semibold text-on-accent disabled:opacity-50"
            >
              Confirmer : {pendingAction.label.toLowerCase()}
            </button>
            <button type="button" onClick={() => setAsking(null)} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-muted hover:text-fg">
              Retour
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((a, i) => (
            <button
              key={a.status}
              type="button"
              disabled={pending}
              onClick={() => {
                if (a.needsMessage) return setAsking(a.status);
                if (window.confirm(`${a.label} ?`)) run(a.status, a.label);
              }}
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-50",
                i === 0 && !a.danger
                  ? "bg-accent text-on-accent hover:bg-accent-strong"
                  : a.danger
                    ? "border border-danger/40 text-danger hover:bg-danger-soft"
                    : "border border-border-strong hover:border-fg",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      {feedback && (
        <p role="status" className={cn("text-sm font-semibold", feedback.ok ? "text-signal" : "text-danger")}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
