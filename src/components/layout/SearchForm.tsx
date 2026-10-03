"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { DeviceIllustration } from "@/components/product/DeviceIllustration";
import { Icon } from "@/components/ui/Icon";
import type { SuggestionIndex } from "@/lib/catalog/repository";
import { highlightParts, queryTerms, relevance } from "@/lib/catalog/search";
import { t } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

const MIN_CHARS = 2;
const MAX_PRODUCTS = 6;
const MAX_CATEGORIES = 2;

/** Index chargé une seule fois par page (au premier clic dans une barre de recherche). */
let indexPromise: Promise<SuggestionIndex | null> | null = null;
function loadIndex(): Promise<SuggestionIndex | null> {
  indexPromise ??= fetch("/api/suggestions")
    .then((r) => (r.ok ? (r.json() as Promise<SuggestionIndex>) : null))
    .catch(() => null);
  return indexPromise;
}

type Option =
  | { kind: "category"; id: string; label: string; url: string }
  | { kind: "product"; id: string; label: string; url: string; brand: string; price: number; from: boolean; device: SuggestionIndex["products"][number]["kind"]; color: string }
  | { kind: "all"; id: string; label: string; url: string };

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightParts(text, terms).map((part, i) =>
        part.match ? (
          <mark key={i} className="bg-transparent font-semibold text-accent">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Barre de recherche avec suggestions instantanées (modèle ARIA « combobox ») :
 * dès 2 caractères, catégories puis produits les plus pertinents, filtrés localement.
 * Reste un formulaire GET classique vers /recherche : fonctionne sans JavaScript.
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
  const listId = `${id}-suggestions`;
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState(defaultValue ?? "");
  const [index, setIndex] = useState<SuggestionIndex | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const terms = useMemo(() => queryTerms(query), [query]);
  const ready = query.trim().length >= MIN_CHARS && index !== null;

  const options = useMemo<Option[]>(() => {
    if (!ready || !index) return [];
    const cats = index.categories
      .filter((c) => terms.every((t) => c.h.includes(t)))
      .slice(0, MAX_CATEGORIES)
      .map((c): Option => ({ kind: "category", id: `${id}-c-${c.url}`, label: c.name, url: c.url }));
    const prods = index.products
      .map((p) => ({ p, score: relevance(p.n, p.h, terms) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PRODUCTS)
      .map(({ p }): Option => ({
        kind: "product",
        id: `${id}-p-${p.url}`,
        label: p.name,
        url: p.url,
        brand: p.brand,
        price: p.price,
        from: p.from,
        device: p.kind,
        color: p.color,
      }));
    const allUrl = `/recherche?q=${encodeURIComponent(query.trim())}${category ? `&categorie=${category}` : ""}`;
    return [...cats, ...prods, { kind: "all", id: `${id}-all`, label: query.trim(), url: allUrl }];
  }, [ready, index, terms, id, query, category]);

  const productCount = options.filter((o) => o.kind === "product").length;
  const showList = open && ready;

  // Fermeture au clic en dehors.
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  function prepare() {
    if (!index) void loadIndex().then(setIndex);
  }

  function go(url: string) {
    setOpen(false);
    router.push(url);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showList || options.length === 0) {
      if (e.key === "ArrowDown" && ready) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(options[active].url);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form ref={rootRef} action="/recherche" method="get" role="search" className={cn("relative", className)} onSubmit={() => setOpen(false)}>
      {category && <input type="hidden" name="categorie" value={category} />}
      <label htmlFor={id} className="sr-only">
        {t.search.label}
      </label>
      <input
        id={id}
        type="search"
        name="q"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
          prepare();
        }}
        onFocus={() => {
          prepare();
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={t.search.placeholder}
        autoComplete="off"
        enterKeyHint="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? options[active]?.id : undefined}
        className="h-11 w-full rounded-full border border-border bg-surface pl-5 pr-14 text-base shadow-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none md:h-12"
      />
      <button
        type="submit"
        aria-label={t.search.submit}
        className="absolute right-1 top-1 inline-flex size-9 items-center justify-center rounded-full bg-accent text-on-accent transition-colors hover:bg-accent-strong md:size-10"
      >
        <Icon name="search" size={18} />
      </button>

      <div
        className={cn(
          "absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-md",
          !showList && "hidden",
        )}
      >
        <ul id={listId} role="listbox" aria-label={t.search.label} className="max-h-[min(70vh,28rem)] overflow-y-auto py-1.5">
          {options.map((o, i) => (
            <li
              key={o.id}
              id={o.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault() /* garde le focus dans le champ */}
              onClick={() => go(o.url)}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2",
                i === active && "bg-surface-2",
                o.kind === "all" && "mt-1 border-t border-border py-3",
              )}
            >
              {o.kind === "category" && (
                <>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Icon name="menu" size={16} />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium">
                      <Highlight text={o.label} terms={terms} />
                    </span>
                    <span className="text-xs text-muted">Catégorie</span>
                  </span>
                </>
              )}
              {o.kind === "product" && (
                <>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-2 p-1">
                    <DeviceIllustration kind={o.device} color={o.color} className="text-fg" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      <Highlight text={o.label} terms={terms} />
                    </span>
                    <span className="block truncate text-xs text-muted">{o.brand}</span>
                  </span>
                  <span className="shrink-0 text-right text-sm font-semibold tabular">
                    {o.from && <span className="block text-xs font-normal text-muted">dès</span>}
                    {formatPrice(o.price)}
                  </span>
                </>
              )}
              {o.kind === "all" && (
                <span className="flex w-full items-center gap-2 text-sm font-semibold text-accent">
                  <Icon name="search" size={16} />
                  <span className="truncate">
                    {productCount > 0 ? "Voir tous les résultats pour" : "Aucune suggestion — chercher"} « {o.label} »
                  </span>
                  <Icon name="arrowRight" size={16} className="ml-auto shrink-0" />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <p className="sr-only" aria-live="polite">
        {showList ? (productCount > 0 ? `${productCount} suggestion${productCount > 1 ? "s" : ""} disponible${productCount > 1 ? "s" : ""}` : "Aucune suggestion") : ""}
      </p>
    </form>
  );
}
