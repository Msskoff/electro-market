import { Container } from "@/components/ui/Container";
import { LoadingStatus, PageHeadingSkeleton, ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Page catégorie (et ses pages 2…n) : titre, bandeau (≥ 640 px), grille de cartes. */
export default function Loading() {
  return (
    <Container>
      <LoadingStatus label="Chargement des produits…" />
      <PageHeadingSkeleton titleWidth="w-1/2 sm:w-1/4" />
      <Skeleton className="mt-6 hidden h-56 w-full rounded-xl sm:block" />
      <div className="pb-10 pt-6 sm:pt-10">
        <div className="mb-4 flex justify-between border-b border-border pb-3 sm:mb-6 sm:pb-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="hidden h-5 w-48 sm:block" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </Container>
  );
}
