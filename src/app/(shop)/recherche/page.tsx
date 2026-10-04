import { TrackEvent } from "@/components/analytics/Analytics";
import Link from "next/link";
import { SearchForm } from "@/components/layout/SearchForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { getBrands, getCategory, searchProducts } from "@/lib/catalog/repository";
import { categoryPath } from "@/lib/catalog/selectors";
import { t } from "@/lib/i18n/fr";
import { buildMetadata } from "@/lib/seo/metadata";

/** Recherche interne (et filtres « marque » des catégories) : jamais indexée (voir robots.ts). */
export const metadata = buildMetadata({
  title: t.search.title,
  description: "Rechercher un produit dans le catalogue.",
  path: "/recherche",
  noindex: true,
});

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SearchPage({ searchParams }: PageProps<"/recherche">) {
  const params = await searchParams;
  const query = first(params.q)?.trim().slice(0, 100) ?? "";
  const category = await getCategory(first(params.categorie) ?? "");
  const [results, brands] = await Promise.all([searchProducts(query, category?.slug), getBrands()]);

  return (
    <Container className="py-12">
      <h1 className="text-h1">{t.search.title}</h1>
      {query && <TrackEvent key={`${query}-${category?.slug ?? ""}`} t="search" q={query.slice(0, 80)} n={results.length} />}
      <SearchForm defaultValue={query} category={category?.slug} className="mt-6 max-w-xl" />

      {category && (
        <p className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Filtré sur</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-3 pr-1 font-medium text-accent">
            {category.name}
            <Link
              href={`/recherche?q=${encodeURIComponent(query)}`}
              aria-label={`Retirer le filtre ${category.name}`}
              className="inline-flex size-6 items-center justify-center rounded-full hover:bg-accent/10"
            >
              <Icon name="close" size={14} />
            </Link>
          </span>
          <Link href={categoryPath(category.slug)} className="ml-1 font-medium text-accent underline-offset-4 hover:underline">
            Revenir à la catégorie {category.name}
          </Link>
        </p>
      )}

      <p className="mt-8 text-muted" role="status">
        {query === "" ? t.search.empty : results.length > 0 ? t.search.results(results.length, query) : t.search.none(query)}
      </p>

      {results.length > 0 ? (
        <div className="mt-6">
          <ProductGrid products={results} brands={brands} headingLevel="h2" />
        </div>
      ) : (
        query !== "" && (
          <ButtonLink href={category ? categoryPath(category.slug) : "/"} variant="secondary" className="mt-6">
            {t.cart.continue}
          </ButtonLink>
        )
      )}
    </Container>
  );
}
