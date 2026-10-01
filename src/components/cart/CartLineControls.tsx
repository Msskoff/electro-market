"use client";

import { useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { updateCartLine } from "@/lib/cart/actions";
import { notifyCartChanged } from "@/lib/cart/client";
import { MAX_QTY_PER_LINE } from "@/lib/cart/schema";
import { t } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils/cn";

/** Sélecteur de quantité + suppression d'une ligne du panier. */
export function CartLineControls({
  sku,
  qty,
  max,
  productName,
}: {
  sku: string;
  qty: number;
  /** Plafond : stock disponible ou limite par ligne. */
  max: number;
  productName: string;
}) {
  const [pending, startTransition] = useTransition();
  const limit = Math.min(max, MAX_QTY_PER_LINE);

  function setQty(next: number) {
    const fd = new FormData();
    fd.set("sku", sku);
    fd.set("qty", String(next));
    startTransition(async () => {
      const res = await updateCartLine(fd);
      if (res.ok) notifyCartChanged();
    });
  }

  const stepper =
    "inline-flex size-9 items-center justify-center text-muted transition-colors hover:text-fg disabled:opacity-40";

  return (
    <div className={cn("flex items-center gap-4", pending && "opacity-60")} aria-busy={pending}>
      <div className="inline-flex items-center rounded-md border border-border">
        <button
          type="button"
          className={stepper}
          onClick={() => setQty(qty - 1)}
          disabled={pending}
          aria-label={`${t.cart.decrease} — ${productName}`}
        >
          <Icon name="minus" size={16} />
        </button>
        <output className="tabular w-8 text-center font-mono text-sm" aria-live="polite">
          {qty}
        </output>
        <button
          type="button"
          className={stepper}
          onClick={() => setQty(qty + 1)}
          disabled={pending || qty >= limit}
          aria-label={`${t.cart.increase} — ${productName}`}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setQty(0)}
        disabled={pending}
        className="text-sm text-muted underline-offset-4 hover:text-danger hover:underline"
      >
        {t.cart.remove}
        <span className="sr-only"> {productName}</span>
      </button>
    </div>
  );
}
