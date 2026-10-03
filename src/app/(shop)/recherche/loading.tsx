import { Container } from "@/components/ui/Container";
import { LoadingStatus, ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Résultats de recherche (page dynamique) : titre, champ, grille. */
export default function Loading() {
  return (
    <Container className="py-12">
      <LoadingStatus label="Recherche en cours…" />
      <Skeleton className="h-9 w-1/2 sm:h-11 sm:w-1/4" />
      <Skeleton className="mt-6 h-11 w-full max-w-xl rounded-full md:h-12" />
      <Skeleton className="mt-8 h-5 w-48" />
      <div className="mt-6">
        <ProductGridSkeleton count={8} />
      </div>
    </Container>
  );
}
