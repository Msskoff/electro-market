import type { Brand, Product } from "@/lib/catalog/types";
import { cn } from "@/lib/utils/cn";
import { ProductCard } from "./ProductCard";

/**
 * Liste de cartes produit.
 * - `grid` : 2 colonnes compactes sur mobile → 3/4 colonnes sur grand écran.
 * - `rail` : sur mobile, rangée défilante au doigt (aperçu court : sélection,
 *   produits similaires) ; grille classique à partir de 640 px.
 */
export function ProductGrid({
  products,
  brands,
  headingLevel = "h3",
  columns = 4,
  layout = "grid",
}: {
  products: Product[];
  brands: Brand[];
  headingLevel?: "h2" | "h3";
  columns?: 3 | 4;
  layout?: "grid" | "rail";
}) {
  const brandName = (slug: string) => brands.find((b) => b.slug === slug)?.name ?? slug;
  const desktopCols = columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

  return (
    <ul
      className={cn(
        layout === "rail"
          ? "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0"
          : "grid grid-cols-2 gap-3 sm:gap-4",
        desktopCols,
        "lg:gap-5",
      )}
    >
      {products.map((p) => (
        <li key={p.id} className={cn("flex", layout === "rail" && "w-[46%] shrink-0 snap-start sm:w-auto")}>
          <ProductCard product={p} brandName={brandName(p.brand)} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
