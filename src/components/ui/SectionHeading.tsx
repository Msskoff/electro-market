import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { frenchSpacing } from "@/lib/utils/typography";

interface SectionHeadingProps {
  /** Petite étiquette technique au-dessus du titre (« 01 — Catégories »). */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Action à droite (lien « Tout voir »). */
  action?: ReactNode;
  id?: string;
  as?: "h1" | "h2";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3 text-accent">{eyebrow}</p>}
        <Heading
          id={id}
          className={cn(
            "font-semibold",
            Heading === "h1" ? "text-h1" : "text-h2",
          )}
        >
          {frenchSpacing(title)}
        </Heading>
        {description && <p className="measure mt-3 text-base leading-relaxed text-muted">{frenchSpacing(description)}</p>}
      </div>
      {action}
    </div>
  );
}
