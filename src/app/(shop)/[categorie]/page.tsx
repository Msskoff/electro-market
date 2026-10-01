import { notFound } from "next/navigation";
import { CategoryView } from "@/components/catalog/CategoryView";
import { getCategories, getCategory, getProductsByCategory } from "@/lib/catalog/repository";
import { categoryPath } from "@/lib/catalog/selectors";
import { buildMetadata, clampDescription } from "@/lib/seo/metadata";

/** Seules les catégories connues existent : toute autre URL renvoie une 404. */
export const dynamicParams = false;

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
