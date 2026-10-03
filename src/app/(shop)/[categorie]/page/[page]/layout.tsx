import { notFound } from "next/navigation";
import { getProductsByCategory } from "@/lib/catalog/repository";
import { pageCount } from "@/lib/catalog/pagination";

/** Numéro de page hors limites → vraie 404 (vérifié avant le squelette de chargement). */
export default async function CategoryPageLayout({ children, params }: LayoutProps<"/[categorie]/page/[page]">) {
  const { categorie, page } = await params;
  const n = Number(page);
  const total = pageCount((await getProductsByCategory(categorie)).length);
  if (!Number.isInteger(n) || n < 2 || n > total) notFound();
  return children;
}
