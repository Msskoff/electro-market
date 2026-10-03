import { Container } from "@/components/ui/Container";
import { LoadingStatus, Skeleton } from "@/components/ui/Skeleton";

/** Espace client (page dynamique, lecture en base) : en-tête puis sections. */
export default function Loading() {
  return (
    <Container className="pb-12">
      <LoadingStatus label="Chargement de votre compte…" />
      <div className="py-5">
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </Container>
  );
}
