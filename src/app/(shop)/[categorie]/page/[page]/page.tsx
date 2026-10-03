import { notFound } from "next/navigation";
import { CategoryView } from "@/components/catalog/CategoryView";
import { getCategories, getCategory, getProductsByCategory } from "@/lib/catalog/repository";
import { categoryPagePath, pageCount } from "@/lib/catalog/pagination";
import { buildMetadata, clampDescription } from "@/lib/seo/metadata";

/**
 * Pages 2…n d'une catégorie (/smartphones/page/2). La page 1 n'existe qu'à
 * l'URL de la catégorie ; chaque page paginée a sa propre URL canonique.
 *
 * Pages connues au build générées à l'avance ; les autres (produit ajouté depuis /admin,
 * nouvelle page de pagination) sont générées à la première visite puis mises en cache.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();
  const params: { categorie: string; page: string }[] = [];
  for (const c of categories) {
    const total = pageCount((await getProductsByCategory(c.slug)).length);
    for (let page = 2; page <= total; page++) params.push({ categorie: c.slug, page: String(page) });
  }
  return params;
}

async function resolve(params: PageProps<"/[categorie]/page/[page]">["params"]) {
  const { categorie, page } = await params;
  const category = await getCategory(categorie);
  const n = Number(page);
  if (!category || !Number.isInteger(n) || n < 2) return null;
  const total = pageCount((await getProductsByCategory(category.slug)).length);
  return n <= total ? { category, page: n } : null;
}

export async function generateMetadata({ params }: PageProps<"/[categorie]/page/[page]">) {
  const resolved = await resolve(params);
  if (!resolved) return {};
  const { category, page } = resolved;
  return buildMetadata({
    title: `${category.name} — page ${page}`,
    description: clampDescription(`Page ${page} de notre sélection : ${category.intro}`),
    path: categoryPagePath(category.slug, page),
  });
}

export default async function CategoryPaginatedPage({ params }: PageProps<"/[categorie]/page/[page]">) {
  const resolved = await resolve(params);
  if (!resolved) notFound();
  return <CategoryView category={resolved.category} page={resolved.page} />;
}
