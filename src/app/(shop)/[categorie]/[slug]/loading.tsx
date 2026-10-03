import { Container } from "@/components/ui/Container";
import { LoadingStatus, Skeleton } from "@/components/ui/Skeleton";

/** Fiche produit : visuel + bloc d'achat, aux proportions de ProductHero. */
export default function Loading() {
  return (
    <Container className="pb-24 lg:pb-16">
      <LoadingStatus label="Chargement du produit…" />
      <div className="py-5">
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <Skeleton className="aspect-[4/3] w-full rounded-lg sm:aspect-square" />
        <div className="flex flex-col gap-6">
          <div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-9 w-4/5 sm:h-11" />
            <div className="mt-4 space-y-2.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="mt-4 flex gap-1.5">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-6 h-4 w-28" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-11 w-24 rounded-full" />
              <Skeleton className="h-11 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-6 h-12 w-full rounded-full" />
            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
