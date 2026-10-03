"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { FaqItem } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { AdminField, inputClasses } from "./ui";

/** Déplace l'élément i d'un cran (−1 haut, +1 bas). */
export function move<T>(list: T[], i: number, delta: -1 | 1): T[] {
  const j = i + delta;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function TextInput({
  label,
  value,
  onChange,
  error,
  hint,
  className,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <AdminField id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClasses(error)}
        {...rest}
      />
    </AdminField>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  error,
  hint,
  rows = 4,
  maxLength,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}) {
  const id = useId();
  const counter = maxLength ? `${value.length} / ${maxLength} caractères` : undefined;
  return (
    <AdminField id={id} label={label} error={error} hint={[hint, counter].filter(Boolean).join(" · ") || undefined} className={className}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className={cn(inputClasses(error), "resize-y leading-relaxed")}
      />
    </AdminField>
  );
}

/** Montant entier en francs CFA, avec rappel formaté sous le champ. */
export function MoneyInput({
  label,
  value,
  onChange,
  error,
  optional,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  error?: string;
  optional?: boolean;
}) {
  const id = useId();
  return (
    <AdminField id={id} label={label} error={error} hint={value ? `= ${formatPrice(value)}` : optional ? "Facultatif" : "Montant en F CFA"}>
      <input
        id={id}
        inputMode="numeric"
        value={value === undefined || Number.isNaN(value) ? "" : String(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits === "" ? (optional ? undefined : 0) : Number(digits));
        }}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className={cn(inputClasses(error), "tabular")}
      />
    </AdminField>
  );
}

export function IntInput({ label, value, onChange, error, hint, min = 0 }: { label: string; value: number; onChange: (v: number) => void; error?: string; hint?: string; min?: number }) {
  const id = useId();
  return (
    <AdminField id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        type="number"
        min={min}
        step={1}
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Math.trunc(Number(e.target.value)))}
        aria-invalid={!!error || undefined}
        className={cn(inputClasses(error), "tabular")}
      />
    </AdminField>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <AdminField id={id} label={label} error={error} hint={hint}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClasses(error)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </AdminField>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors", checked ? "bg-accent" : "bg-border-strong")}
      >
        <span aria-hidden className={cn("inline-block size-5 rounded-full bg-surface shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </label>
    </div>
  );
}

export function IconButton({ label, icon, onClick, disabled, tone = "neutral" }: { label: string; icon: Parameters<typeof Icon>[0]["name"]; onClick: () => void; disabled?: boolean; tone?: "neutral" | "danger" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30",
        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

export function AddButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed border-border-strong px-4 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-40"
    >
      <Icon name="plus" size={16} />
      {children}
    </button>
  );
}

/** Liste de textes courts ou longs (paragraphes, points clés, contenu de la boîte). */
export function StringList({
  label,
  items,
  onChange,
  addLabel,
  max = 20,
  multiline,
  errorFor,
  itemLabel,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  max?: number;
  multiline?: boolean;
  errorFor?: (i: number) => string | undefined;
  itemLabel: (i: number) => string;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1">
          <div className="min-w-0 flex-1">
            {multiline ? (
              <TextArea label={itemLabel(i)} value={item} rows={3} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} error={errorFor?.(i)} />
            ) : (
              <TextInput label={itemLabel(i)} value={item} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} error={errorFor?.(i)} />
            )}
          </div>
          <div className="mt-7 flex">
            <IconButton label={`Monter : ${itemLabel(i)}`} icon="arrowUp" onClick={() => onChange(move(items, i, -1))} disabled={i === 0} />
            <IconButton label={`Descendre : ${itemLabel(i)}`} icon="arrowDown" onClick={() => onChange(move(items, i, 1))} disabled={i === items.length - 1} />
            <IconButton label={`Supprimer : ${itemLabel(i)}`} icon="trash" tone="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </div>
        </div>
      ))}
      <div>
        <AddButton onClick={() => onChange([...items, ""])} disabled={items.length >= max}>
          {addLabel}
        </AddButton>
      </div>
    </fieldset>
  );
}

/** Questions / réponses (FAQ produit, catégorie ou site). */
export function FaqList({ items, onChange, errorFor, hint }: { items: FaqItem[]; onChange: (items: FaqItem[]) => void; errorFor?: (path: string) => string | undefined; hint?: string }) {
  return (
    <div className="flex flex-col gap-4">
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {items.map((f, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="flex items-start gap-1">
            <div className="grid min-w-0 flex-1 gap-3">
              <TextInput label={`Question ${i + 1}`} value={f.question} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, question: v } : x)))} error={errorFor?.(`${i}.question`)} />
              <TextArea label="Réponse" value={f.answer} rows={3} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, answer: v } : x)))} error={errorFor?.(`${i}.answer`)} />
            </div>
            <div className="mt-7 flex flex-col">
              <IconButton label={`Monter la question ${i + 1}`} icon="arrowUp" onClick={() => onChange(move(items, i, -1))} disabled={i === 0} />
              <IconButton label={`Descendre la question ${i + 1}`} icon="arrowDown" onClick={() => onChange(move(items, i, 1))} disabled={i === items.length - 1} />
              <IconButton label={`Supprimer la question ${i + 1}`} icon="trash" tone="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} />
            </div>
          </div>
        </div>
      ))}
      <div>
        <AddButton onClick={() => onChange([...items, { question: "", answer: "" }])} disabled={items.length >= 20}>
          Ajouter une question
        </AddButton>
      </div>
    </div>
  );
}

/** Section de formulaire (carte blanche + titre). */
export function FormSection({ id, title, description, children, className }: { id: string; title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-xl bg-surface p-5 shadow-sm sm:p-6", className)}>
      <h2 id={id} className="text-h3 font-semibold">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
