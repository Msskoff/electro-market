import { useId } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import type { FaqItem } from "@/lib/catalog/types";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils/cn";
import { frenchSpacing } from "@/lib/utils/typography";

interface FaqProps {
  items: FaqItem[];
  title?: string;
  /** Émettre le schéma FAQPage (une seule FAQ structurée par page). */
  withSchema?: boolean;
  className?: string;
}

/**
 * FAQ accessible sans JavaScript (<details>/<summary>).
 * Les réponses restent dans le HTML, donc lisibles par les robots même repliées.
 */
export function Faq({ items, title = "Questions fréquentes", withSchema = true, className }: FaqProps) {
  const titleId = useId();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className="text-h2">
        {title}
      </h2>
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
        {items.map((item) => (
          <details key={frenchSpacing(item.question)} className="details-smooth group">
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-4 font-medium",
                "[&::-webkit-details-marker]:hidden",
              )}
            >
              <h3 className="font-sans text-base font-medium tracking-normal">
                {frenchSpacing(item.question)}
              </h3>
              <span
                aria-hidden
                className="font-mono text-lg text-muted transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="measure px-5 pb-5 leading-relaxed text-muted">{frenchSpacing(item.answer)}</p>
          </details>
        ))}
      </div>
      {withSchema && <JsonLd data={faqJsonLd(items)} />}
    </section>
  );
}
