import { Container } from "@/components/ui/Container";
import { LoadingStatus, PageHeadingSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Panier (page dynamique) : lignes d'articles + récapitulatif. */
export default function Loading() {
  return (
    <Container className="pb-12">
      <LoadingStatus label="Chargement du panier…" />
      <PageHeadingSkeleton titleWidth="w-1/3 sm:w-48" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="h-fit divide-y divide-border rounded-lg border border-border bg-surface">
          {[0, 1].map((i) => (
            <li key={i} className="flex gap-5 p-5">
              <Skeleton className="size-24 shrink-0 rounded-md" />
              <div className="flex flex-1 flex-col gap-2.5">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="mt-2 h-10 w-32 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </Container>
  );
}
