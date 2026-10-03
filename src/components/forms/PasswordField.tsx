"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/** Champ mot de passe avec bouton « Afficher » (utile sur mobile, évite les fautes de frappe). */
export function PasswordField({
  name,
  label,
  error,
  hint,
  autoComplete,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  autoComplete: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);
  const id = `champ-${name}`;
  const describedBy = [hint && !error && `${id}-aide`, error && `${id}-erreur`].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-md border bg-surface pl-3.5 pr-24 text-base transition-colors focus:outline-none",
            error ? "border-danger focus:border-danger" : "border-border-strong focus:border-accent",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-1 top-1 h-9 rounded px-3 text-sm font-medium text-accent hover:bg-accent-soft"
        >
          {visible ? "Masquer" : "Afficher"}
        </button>
      </div>
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
