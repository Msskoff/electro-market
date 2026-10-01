import type { Brand, Product } from "@/lib/catalog/types";
import { ProductCard } from "./ProductCard";

/** Grille responsive de cartes produit (1 → 2 → 3/4 colonnes). */
export function ProductGrid({
  products,
  brands,
  headingLevel = "h3",
  columns = 4,
}: {
  products: Product[];
  brands: Brand[];
  headingLevel?: "h2" | "h3";
  columns?: 3 | 4;
}) {
  const brandName = (slug: string) => brands.find((b) => b.slug === slug)?.name ?? slug;
  return (
    <ul
      className={
        columns === 4
          ? "grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4 lg:gap-5"
          : "grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-5"
      }
    >
      {products.map((p) => (
        <li key={p.id} className="flex">
          <ProductCard product={p} brandName={brandName(p.brand)} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
