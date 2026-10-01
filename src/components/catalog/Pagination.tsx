import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { categoryPagePath } from "@/lib/catalog/pagination";
import { cn } from "@/lib/utils/cn";

/** Pages affichées : première, dernière, et voisines de la page courante. */
function visiblePages(current: number, total: number): (number | "…")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const item =
  "inline-flex size-11 items-center justify-center rounded-full text-sm font-semibold tabular transition-colors";

/** Pagination en liens simples (crawlables, sans JS). */
export function Pagination({ slug, current, total }: { slug: string; current: number; total: number }) {
  if (total <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      {current > 1 ? (
        <Link href={categoryPagePath(slug, current - 1)} rel="prev" aria-label="Page précédente" className={cn(item, "border border-border bg-surface hover:border-accent")}>
          <Icon name="chevronRight" size={18} className="rotate-180" />
        </Link>
      ) : (
        <span aria-hidden className={cn(item, "border border-border opacity-40")}>
          <Icon name="chevronRight" size={18} className="rotate-180" />
        </span>
      )}

      <ol className="flex items-center gap-1.5">
        {visiblePages(current, total).map((p, i) => (
          <li key={`${p}-${i}`}>
            {p === "…" ? (
              <span className="px-1 text-muted">…</span>
            ) : p === current ? (
              <span aria-current="page" className={cn(item, "bg-accent text-on-accent")}>
                {p}
              </span>
            ) : (
              <Link href={categoryPagePath(slug, p)} aria-label={`Page ${p}`} className={cn(item, "hover:bg-surface-2")}>
                {p}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {current < total ? (
        <Link href={categoryPagePath(slug, current + 1)} rel="next" aria-label="Page suivante" className={cn(item, "border border-border bg-surface hover:border-accent")}>
          <Icon name="chevronRight" size={18} />
        </Link>
      ) : (
        <span aria-hidden className={cn(item, "border border-border opacity-40")}>
          <Icon name="chevronRight" size={18} />
        </span>
      )}
    </nav>
  );
}
