import { DeviceIllustrationSvg } from "@/components/product/DeviceIllustration";
import { getBrand, getFeaturedProducts, getProduct } from "@/lib/catalog/repository";
import { defaultVariant } from "@/lib/catalog/selectors";
import { renderOgImage } from "@/lib/seo/og";
import { formatPrice } from "@/lib/utils/format";

/**
 * Visuel produit à URL stable (/categorie/slug/visuel.png).
 * Pré-généré au build pour les produits mis en avant, puis à la demande
 * (et mis en cache) pour le reste du catalogue.
 * Réutilisé comme image Open Graph ET comme `image` du JSON-LD Product.
 * À remplacer par les vraies photos produit lorsqu'elles seront disponibles.
 */
export const dynamic = "force-static";
export async function generateStaticParams() {
  const products = await getFeaturedProducts(20);
  return products.map((p) => ({ categorie: p.category, slug: p.slug }));
}

export async function GET(_request: Request, ctx: RouteContext<"/[categorie]/[slug]/visuel.png">) {
  const { categorie, slug } = await ctx.params;
  const product = await getProduct(categorie, slug);
  if (!product) return new Response("Introuvable", { status: 404 });

  const brand = await getBrand(product.brand);
  const variant = defaultVariant(product);

  return renderOgImage({
    eyebrow: brand?.name ?? "",
    title: product.name,
    subtitle: product.highlights.join("  ·  "),
    price: formatPrice(variant.price),
    visual: DeviceIllustrationSvg({ kind: product.kind, color: variant.color.hex, id: "og", size: 340 }),
  });
}
