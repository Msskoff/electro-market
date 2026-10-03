import Link from "next/link";
import { DeviceIllustration } from "@/components/product/DeviceIllustration";
import { siteConfig } from "@/config/site";
import { defaultVariant, priceRange } from "@/lib/catalog/selectors";
import type { Brand, Category, Product } from "@/lib/catalog/types";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { frenchSpacing } from "@/lib/utils/typography";
import { cn } from "@/lib/utils/cn";

interface CategoryHeaderProps {
  category: Category;
  /** Teinte de la catégorie (même couleur que sa pastille sur l'accueil). */
  tile: string;
  products: Product[];
  brands: Brand[];
  page: number;
}

/**
 * En-tête d'une page catégorie : identité visuelle, chiffres clés lisibles d'un coup d'œil,
 * date de mise à jour (fraîcheur) et raccourcis par marque.
 */
export function CategoryHeader({ category, tile, products, brands, page }: CategoryHeaderProps) {
  const prices = products.flatMap((p) => Object.values(priceRange(p)));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const available = products.filter((p) => p.variants.some((v) => v.stock > 0)).length;
  const updatedAt = products.map((p) => p.updatedAt).sort().at(-1);
  const { policies } = siteConfig;

  // Marques présentes dans la catégorie, de la plus représentée à la moins représentée.
  const brandCounts = brands
    .map((b) => ({ brand: b, count: products.filter((p) => p.brand === b.slug).length }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count || a.brand.name.localeCompare(b.brand.name));

  // Deux appareils réels de la catégorie pour l'illustration.
  const visuals = [...products.filter((p) => p.featured), ...products].filter(
    (p, i, all) => all.findIndex((x) => x.id === p.id) === i,
  ).slice(0, 2);

  const stats = [
    { label: "À partir de", value: formatPrice(minPrice), hint: `jusqu'à ${formatPrice(maxPrice)}` },
    { label: "Disponibles", value: String(available), hint: `sur ${products.length} références` },
    { label: "Marques", value: String(brandCounts.length), hint: `garantie ${policies.warrantyYears} ans` },
    { label: "Livraison", value: `${policies.shippingDays.min * 24} à ${policies.shippingDays.max * 24} h`, hint: `à ${siteConfig.contact.address.city}` },
  ];

  return (
    <header>
      {/* Petit écran : seul le titre reste ; bandeau complet à partir de 640 px. */}
      <div className={cn("relative overflow-hidden max-sm:bg-transparent sm:rounded-xl", tile)}>
        <div className="grid items-center gap-8 pt-5 sm:p-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          <div className="relative z-10">
            {updatedAt && (
              <p className="eyebrow hidden text-accent sm:block">
                Mis à jour le <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
              </p>
            )}

            {/* Même titre sur toutes les pages : la position est indiquée au-dessus de la grille et par la pagination. */}
            <h1 className="text-h1 sm:mt-3">{category.name}</h1>

            {page === 1 && (
              <p className="measure mt-4 hidden text-lg leading-relaxed text-muted sm:block">{frenchSpacing(category.intro)}</p>
            )}

            <dl className="mt-7 hidden grid-cols-4 gap-3 sm:grid">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-surface/80 px-4 py-3 backdrop-blur-sm">
                  <dt className="text-xs font-medium text-muted">{s.label}</dt>
                  <dd className="mt-1 text-lg font-semibold leading-tight tabular">{s.value}</dd>
                  <dd className="mt-0.5 text-xs text-muted">{s.hint}</dd>
                </div>
              ))}
            </dl>

          </div>

          {/* Illustration : deux appareils réels de la catégorie */}
          <div aria-hidden className="relative mx-auto hidden aspect-[4/3] w-full max-w-md md:block">
            <div className="absolute inset-[6%] rounded-full bg-surface/60" />
            {visuals.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "absolute drop-shadow-[0_20px_24px_rgb(22_33_27_/_0.18)]",
                  i === 0 ? "left-[8%] top-[10%] w-[58%]" : "bottom-[4%] right-[6%] w-[46%]",
                )}
              >
                <DeviceIllustration kind={p.kind} color={defaultVariant(p).color.hex} className="text-fg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raccourcis par marque (recherche filtrée, non indexée) */}
      {brandCounts.length > 1 && (
        <nav aria-label={`${category.name} par marque`} className="mt-5">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <li className="flex shrink-0 items-center pr-1 text-sm font-medium text-muted">Par marque</li>
            {brandCounts.map(({ brand, count }) => (
              <li key={brand.slug} className="shrink-0">
                <Link
                  href={`/recherche?q=${encodeURIComponent(brand.name)}&categorie=${category.slug}`}
                  rel="nofollow"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  {brand.name}
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs tabular text-muted">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
