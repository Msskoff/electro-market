import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils/cn";

/**
 * Recherche produit : simple formulaire GET vers /recherche,
 * fonctionnel sans JavaScript.
 */
export function SearchForm({
  defaultValue,
  category,
  className,
}: {
  defaultValue?: string;
  /** Conserve le filtre de catégorie lors d'une nouvelle recherche. */
  category?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <form action="/recherche" method="get" role="search" className={cn("relative", className)}>
      {category && <input type="hidden" name="categorie" value={category} />}
      <label htmlFor={id} className="sr-only">
        {t.search.label}
      </label>
      <input
        id={id}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={t.search.placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-full border border-border bg-surface pl-5 pr-14 text-base md:h-12 shadow-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        aria-label={t.search.submit}
        className="absolute right-1 top-1 inline-flex size-9 items-center md:size-10 justify-center rounded-full bg-accent text-on-accent transition-colors hover:bg-accent-strong"
      >
        <Icon name="search" size={18} />
      </button>
    </form>
  );
}
