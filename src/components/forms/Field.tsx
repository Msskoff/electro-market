import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Champ de formulaire accessible : libellé, aide et erreur reliés au champ
 * (aria-describedby), texte en 16 px (pas de zoom automatique sur iOS).
 */
export function Field({
  name,
  idPrefix = "champ",
  label,
  error,
  hint,
  optional = false,
  className,
  ...input
}: {
  name: string;
  /** Préfixe d'identifiant (plusieurs formulaires sur la même page). */
  idPrefix?: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
} & Omit<ComponentProps<"input">, "name" | "className">) {
  const id = `${idPrefix}-${name}`;
  const describedBy = [hint && !error && `${id}-aide`, error && `${id}-erreur`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (facultatif)</span>}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "mt-1.5 h-11 w-full rounded-md border bg-surface px-3.5 text-base transition-colors focus:outline-none",
          error ? "border-danger focus:border-danger" : "border-border-strong focus:border-accent",
        )}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-aide`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erreur`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
