"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

/** Copie une valeur (numéro à créditer, montant) en un toucher, avec confirmation. */
export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Presse-papiers indisponible : la valeur reste lisible à l'écran.
        }
      }}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 text-sm font-semibold hover:border-fg",
        className,
      )}
    >
      <Icon name={copied ? "check" : "copy"} size={16} className={copied ? "check-in text-signal" : undefined} />
      <span aria-live="polite">{copied ? "Copié" : label}</span>
    </button>
  );
}
