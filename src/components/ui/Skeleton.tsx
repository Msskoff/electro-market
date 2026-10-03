import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils/cn";

/**
 * Squelettes de chargement : affichés instantanément pendant la navigation
 * (fichiers loading.tsx), aux dimensions des vrais contenus pour éviter tout
 * saut de mise en page à l'arrivée des données.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** Annonce unique pour les lecteurs d'écran (les formes grises sont masquées). */
export function LoadingStatus({ label = "Chargement…" }: { label?: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}

/** Même gabarit que ProductCard (image carrée, marque, nom, puce, prix, stock). */
export function ProductCardSkeleton() {
  return (
    <div className="flex w-full flex-col rounded-xl border border-border bg-surface p-2 sm:p-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col gap-2 px-1 pb-1 pt-3 sm:gap-2.5 sm:px-1.5 sm:pt-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="mt-2 h-5 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex">
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** Fil d'Ariane + titre de page. */
export function PageHeadingSkeleton({ titleWidth = "w-2/3 sm:w-1/3" }: { titleWidth?: string }) {
  return (
    <div>
      {/* Même hauteur que <Breadcrumbs> (py-5 + une ligne de 14 px). */}
      <div className="py-5">
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className={cn("h-9 sm:h-11", titleWidth)} />
    </div>
  );
}

/** Squelette générique d'une page (titre + quelques blocs de texte). */
export function PageSkeleton({ label }: { label?: string }) {
  return (
    <Container className="pb-16">
      <LoadingStatus label={label} />
      <PageHeadingSkeleton />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-11/12 max-w-2xl" />
        <Skeleton className="h-4 w-3/4 max-w-2xl" />
      </div>
      <Skeleton className="mt-10 h-48 w-full rounded-xl" />
    </Container>
  );
}
