"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { addToCart } from "@/lib/cart/actions";
import { notifyCartChanged } from "@/lib/cart/client";
import { t } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils/cn";

/**
 * Ajout rapide (variante par défaut) depuis une carte produit.
 * Placé au-dessus du lien étiré de la carte (`relative z-10`).
 */
export function QuickAddButton({ sku, label }: { sku: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!message?.ok) return;
    const id = setTimeout(() => setMessage(null), 2000);
    return () => clearTimeout(id);
  }, [message]);

  function handleClick() {
    startTransition(async () => {
      const result = await addToCart({ sku, qty: 1 });
      if (result.ok) {
        notifyCartChanged();
        setMessage({ ok: true, text: t.product.added });
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  const added = message?.ok === true;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={t.product.quickAdd(label)}
        title={t.product.quickAdd(label)}
        className={cn(
          "relative z-10 inline-flex size-10 shrink-0 items-center justify-center rounded-full shadow-md transition-[background-color,transform] duration-150 ease-out active:scale-95 disabled:opacity-60",
          added ? "bg-signal text-on-accent" : "bg-accent text-on-accent hover:bg-accent-strong",
        )}
      >
        <Icon key={added ? "check" : "cart"} name={added ? "check" : "cart"} size={18} className={added ? "check-in" : undefined} />
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {message?.text}
      </span>
    </>
  );
}
