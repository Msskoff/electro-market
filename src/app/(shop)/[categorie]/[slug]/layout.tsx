import { notFound, permanentRedirect } from "next/navigation";
import { findProductRedirect, getProduct } from "@/lib/catalog/repository";

/**
 * Produit introuvable, vérifié AVANT le squelette de chargement (statut HTTP correct) :
 * URL modifiée depuis l'administration → redirection permanente vers la nouvelle ;
 * produit retiré → redirection vers sa catégorie (jamais de 404 en masse, CLAUDE.md § 6.4).
 */
export default async function ProductLayout({ children, params }: LayoutProps<"/[categorie]/[slug]">) {
  const { categorie, slug } = await params;
  if (await getProduct(categorie, slug)) return children;
  const moved = await findProductRedirect(`/${categorie}/${slug}`);
  if (moved) permanentRedirect(moved);
  permanentRedirect(`/${categorie}`);
  return notFound();
}
