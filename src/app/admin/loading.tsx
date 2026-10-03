import { LoadingStatus, Skeleton } from "@/components/ui/Skeleton";

/** Squelette de l'administration (cartes du tableau de bord). */
export default function Loading() {
  return (
    <div>
      <LoadingStatus />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-72 rounded-xl" />
    </div>
  );
}
