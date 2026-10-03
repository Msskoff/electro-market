"use client";

import { useState, useTransition } from "react";
import { setProductInStock } from "@/lib/admin/actions";
import { cn } from "@/lib/utils/cn";

/**
 * Bascule « En stock / Rupture » en un geste. Effet immédiat sur le site (pas de brouillon),
 * avec confirmation visible : « Enregistré » ou message d'erreur (l'état revient en arrière).
 */
export function StockToggle({ id, initial, disabled, label }: { id: string; initial: boolean; disabled?: boolean; label: string }) {
  const [inStock, setInStock] = useState(initial);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !inStock;
    setInStock(next); // optimiste
    setFeedback(null);
    startTransition(async () => {
      const result = await setProductInStock(id, next);
      if (result.ok) {
        setFeedback({ ok: true, text: next ? "Remis en stock" : "Mis en rupture" });
      } else {
        setInStock(!next);
        setFeedback({ ok: false, text: result.error });
      }
    });
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={inStock}
        aria-label={`${label} : ${inStock ? "en stock" : "en rupture"}`}
        disabled={disabled || pending}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50",
          inStock ? "bg-signal" : "bg-border-strong",
        )}
      >
        <span
          aria-hidden
          className={cn("inline-block size-5 rounded-full bg-surface shadow transition-transform duration-200", inStock ? "translate-x-6" : "translate-x-1")}
        />
      </button>
      <span className={cn("text-xs font-semibold", inStock ? "text-signal" : "text-muted")}>{inStock ? "En stock" : "Rupture"}</span>
      <span role="status" aria-live="polite" className={cn("text-xs", feedback?.ok ? "text-muted" : "text-danger")}>
        {pending ? "…" : feedback?.text}
      </span>
    </div>
  );
}
