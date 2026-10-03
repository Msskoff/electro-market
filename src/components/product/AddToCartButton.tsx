"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { addToCart } from "@/lib/cart/actions";
import { notifyCartChanged } from "@/lib/cart/client";
import { t } from "@/lib/i18n/fr";

type Status = { kind: "idle" } | { kind: "added" } | { kind: "error"; message: string };

/**
 * Bouton d'ajout au panier. Le parent lui passe `key={sku}` pour réinitialiser
 * son état (message de confirmation) à chaque changement de variante.
 */
export function AddToCartButton({
  sku,
  disabled,
  compact = false,
}: {
  sku: string;
  disabled?: boolean;
  /** Version courte pour la barre mobile. */
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function handleClick() {
    startTransition(async () => {
      const result = await addToCart({ sku, qty: 1 });
      if (result.ok) {
        notifyCartChanged();
        setStatus({ kind: "added" });
      } else {
        setStatus({ kind: "error", message: result.error });
      }
    });
  }

  const label = disabled ? t.product.outOfStock : pending ? t.product.adding : t.product.addToCart;

  return (
    <div className={compact ? "" : "flex flex-col gap-3"}>
      <Button
        onClick={handleClick}
        disabled={disabled || pending}
        size={compact ? "md" : "lg"}
        fullWidth={!compact}
        aria-describedby={compact ? undefined : `${sku}-status`}
      >
        <Icon
          key={status.kind}
          name={status.kind === "added" ? "check" : "cart"}
          size={18}
          className={status.kind === "added" ? "check-in" : undefined}
        />
        {compact && !disabled ? "Ajouter" : label}
      </Button>

      {!compact && (
        <p id={`${sku}-status`} role="status" aria-live="polite" className="min-h-5 text-sm">
          {status.kind === "added" && (
            <span className="text-signal">
              {t.product.added} —{" "}
              <Link href="/panier" className="font-medium underline underline-offset-4">
                {t.product.viewCart}
              </Link>
            </span>
          )}
          {status.kind === "error" && <span className="text-danger">{status.message}</span>}
        </p>
      )}
    </div>
  );
}
