import { notFound } from "next/navigation";
import { getCategory } from "@/lib/catalog/repository";

/**
 * Vérifie que la catégorie existe AVANT les squelettes de chargement (loading.tsx) des
 * pages enfants : sinon la réponse partirait en 200 avant le notFound() (« soft 404 »).
 */
export default async function CategoryLayout({ children, params }: LayoutProps<"/[categorie]">) {
  const { categorie } = await params;
  if (!(await getCategory(categorie))) notFound();
  return children;
}
