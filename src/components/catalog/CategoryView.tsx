import { Faq } from "@/components/content/Faq";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { absoluteUrl } from "@/config/site";
import { getBrands, getCategories, getProductsByCategory } from "@/lib/catalog/repository";
import { PAGE_SIZE, categoryPagePath, pageCount, paginate } from "@/lib/catalog/pagination";
import { categoryPath } from "@/lib/catalog/selectors";
import type { Category } from "@/lib/catalog/types";
import { getGuides } from "@/lib/content/guides";
import { itemListJsonLd } from "@/lib/seo/jsonld";
import { CategoryHeader } from "./CategoryHeader";
import { categoryTile } from "./categoryTheme";
import { Pagination } from "./Pagination";

/** Contenu d'une page de catégorie (page 1 ou suivantes). */
export async function CategoryView({ category, page }: { category: Category; page: number }) {
  const [products, brands, categories] = await Promise.all([
    getProductsByCategory(category.slug),
    getBrands(),
    getCategories(),
  ]);
  const total = pageCount(products.length);
  const visible = paginate(products, page);
  const guides = getGuides().filter((g) => g.category === category.slug);
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = first + visible.length - 1;

  const crumbs = [{ name: category.name, path: categoryPath(category.slug) }];
  if (page > 1) crumbs.push({ name: `Page ${page}`, path: categoryPagePath(category.slug, page) });

  return (
    <Container>
      <Breadcrumbs items={crumbs} />

      <CategoryHeader
        category={category}
        tile={categoryTile(categories.findIndex((c) => c.slug === category.slug))}
        products={products}
        brands={brands}
        guides={guides}
        page={page}
        totalPages={total}
      />

      <section aria-labelledby="liste-produits" className="pb-10 pt-10">
        {visible.length > 0 ? (
          <>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
              <h2 id="liste-produits" className="font-sans text-base font-semibold tracking-normal">
                {products.length} références
              </h2>
              <p className="text-sm text-muted tabular">
                Produits {first} à {last} · page {page} sur {total}
              </p>
            </div>
            <ProductGrid products={visible} brands={brands} headingLevel="h3" />
            <div className="mt-12">
              <Pagination slug={category.slug} current={page} total={total} />
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-muted">
            De nouveaux modèles arrivent bientôt dans cette catégorie.
          </p>
        )}
      </section>

      {page === 1 && (
        <Faq items={category.faq} title={`Questions fréquentes : ${category.name}`} className="max-w-3xl py-10" />
      )}

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page > 1 ? `${category.name} — page ${page}` : category.name,
            description: category.intro,
            url: absoluteUrl(categoryPagePath(category.slug, page)),
          },
          itemListJsonLd(category.name, visible, first - 1),
        ]}
      />
    </Container>
  );
}
