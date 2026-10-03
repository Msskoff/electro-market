import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { PublishState } from "@/lib/admin/queries";
import { cn } from "@/lib/utils/cn";

/** Carte blanche arrondie (élément de base du tableau de bord). */
export function AdminCard({ children, className, as: Tag = "section", ...rest }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" } & Record<string, unknown>) {
  return (
    <Tag className={cn("rounded-xl bg-surface p-5 shadow-sm sm:p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** En-tête de page : titre, sous-titre, recherche produits et actions. */
export function AdminPageHeader({
  title,
  subtitle,
  actions,
  search = true,
  defaultQuery,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  search?: boolean;
  defaultQuery?: string;
}) {
  return (
    <header className="mb-5 flex flex-col gap-4 sm:mb-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <h1 className="text-h2 font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {search && (
          <form action="/admin/produits" method="get" role="search" className="relative w-full sm:w-80">
            <label htmlFor="admin-search" className="sr-only">
              Rechercher un produit
            </label>
            <input
              id="admin-search"
              type="search"
              name="q"
              defaultValue={defaultQuery}
              placeholder="Rechercher un produit, une référence…"
              className="h-12 w-full rounded-full bg-surface pl-5 pr-14 text-base shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-accent"
            />
            <button type="submit" aria-label="Rechercher" className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-full bg-inverse text-on-inverse">
              <Icon name="search" size={18} />
            </button>
          </form>
        )}
        {actions}
      </div>
    </header>
  );
}

const stateStyles: Record<PublishState, { label: string; className: string }> = {
  published: { label: "En ligne", className: "bg-signal-soft text-signal" },
  "published-with-draft": { label: "En ligne · brouillon en cours", className: "bg-warning-soft text-warning" },
  "draft-only": { label: "Brouillon · jamais publié", className: "bg-accent-soft text-accent" },
};

export function PublishStateBadge({ state, className }: { state: PublishState; className?: string }) {
  const s = stateStyles[state];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", s.className, className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

/** Champ de formulaire standard de l'administration (libellé, aide, erreur reliés). */
export function AdminField({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Classes des champs : 16 px (pas de zoom iOS), anneau d'erreur. */
export function inputClasses(error?: string) {
  return cn(
    "min-h-11 w-full rounded-md border bg-surface px-3 py-2 text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25",
    error ? "border-danger" : "border-border-strong",
  );
}
