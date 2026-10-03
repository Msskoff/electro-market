import { Container } from "@/components/ui/Container";
import { LoadingStatus, PageHeadingSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Commande (page dynamique) : étapes, adresse de livraison, récapitulatif. */
export default function Loading() {
  return (
    <Container className="pb-12">
      <LoadingStatus label="Préparation de votre commande…" />
      <PageHeadingSkeleton titleWidth="w-1/2 sm:w-64" />
      <Skeleton className="mt-6 h-10 w-full max-w-xl rounded-full" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </Container>
  );
}
