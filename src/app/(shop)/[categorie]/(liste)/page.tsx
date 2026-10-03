import { notFound } from "next/navigation";
import { CategoryView } from "@/components/catalog/CategoryView";
import { getCategories, getCategory, getProductsByCategory } from "@/lib/catalog/repository";
import { categoryPath } from "@/lib/catalog/selectors";
import { buildMetadata, clampDescription } from "@/lib/seo/metadata";

/**
 * Pages connues au build générées à l'avance ; les autres (produit ajouté depuis /admin,
 * nouvelle page de pagination) sont générées à la première visite puis mises en cache.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ categorie: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[categorie]">) {
  const { categorie } = await params;
  const category = await getCategory(categorie);
  if (!category) return {};
  const products = await getProductsByCategory(category.slug);
  return buildMetadata({
    title: `${category.name} : ${products.length} modèles comparés`,
    description: clampDescription(category.intro),
    path: categoryPath(category.slug),
  });
}

export default async function CategoryPage({ params }: PageProps<"/[categorie]">) {
  const { categorie } = await params;
  const category = await getCategory(categorie);
  if (!category) notFound();
  return <CategoryView category={category} page={1} />;
}
