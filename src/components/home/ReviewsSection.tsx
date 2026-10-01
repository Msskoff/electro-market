import { Icon } from "@/components/ui/Icon";
import type { Review } from "@/lib/catalog/types";
import { formatDate } from "@/lib/utils/format";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex text-star" role="img" aria-label={`Note : ${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" aria-hidden fill={i < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1-4.5-4.2 6.1-.8z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Avis clients vérifiés. Ne rend RIEN tant qu'aucun avis réel n'existe :
 * aucun témoignage n'est inventé (règle CLAUDE.md).
 */
export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const verified = reviews.filter((r) => r.verified);
  if (verified.length === 0) return null;
  const average = verified.reduce((sum, r) => sum + r.rating, 0) / verified.length;

  return (
    <section aria-labelledby="avis-title" className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="avis-title" className="text-h2">
          Ce que disent nos clients
        </h2>
        <p className="flex items-center gap-2 text-sm font-medium">
          {average.toLocaleString("fr", { maximumFractionDigits: 1 })}/5 · {verified.length} avis vérifiés
          <Stars rating={Math.round(average)} />
        </p>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {verified.map((r) => (
          <li key={r.id} className="rounded-lg bg-surface-2 p-5">
            <figure>
              <figcaption className="flex items-center gap-2 font-semibold">
                {r.author}
                <Icon name="check" size={16} className="text-signal" aria-label="Achat vérifié" />
              </figcaption>
              <Stars rating={r.rating} />
              <blockquote className="mt-3 text-sm leading-relaxed text-muted">{r.text}</blockquote>
              <p className="mt-3 text-xs text-muted">{formatDate(r.publishedAt)}</p>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
