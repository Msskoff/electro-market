import { notFound } from "next/navigation";
import { Faq } from "@/components/content/Faq";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductHero } from "@/components/product/ProductHero";
import { SpecTable } from "@/components/product/SpecTable";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import {
  getAllProducts,
  getBrand,
  getBrands,
  getCategory,
  getProduct,
  getRelatedProducts,
} from "@/lib/catalog/repository";
import { categoryPath, defaultVariant, productImagePath, productPath } from "@/lib/catalog/selectors";
import { t } from "@/lib/i18n/fr";
import { productJsonLd } from "@/lib/seo/jsonld";
import { getSettings } from "@/lib/settings/repository";
import { buildMetadata, clampDescription } from "@/lib/seo/metadata";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { frenchSpacing } from "@/lib/utils/typography";

/**
 * Pages connues au build générées à l'avance ; les autres (produit ajouté depuis /admin,
 * nouvelle page de pagination) sont générées à la première visite puis mises en cache.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ categorie: p.category, slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[categorie]/[slug]">) {
  const { categorie, slug } = await params;
  const product = await getProduct(categorie, slug);
  if (!product) return {};
  const variant = defaultVariant(product);
  const availability = variant.stock > 0 ? "en stock" : "bientôt disponible";
  return buildMetadata({
    title: `${product.name} ${product.highlights[0] ?? ""}`.trim(),
    description: clampDescription(
      `${product.name} à ${formatPrice(variant.price)}, ${availability}. ${product.summary}`,
    ),
    path: productPath(product),
    image: { url: productImagePath(product), alt: product.name },
  });
}

export default async function ProductPage({ params }: PageProps<"/[categorie]/[slug]">) {
  const { categorie, slug } = await params;
  const product = await getProduct(categorie, slug);
  if (!product) notFound(); // cas traités dans layout.tsx (redirections)

  const [category, brand, related, brands] = await Promise.all([
    getCategory(product.category),
    getBrand(product.brand),
    getRelatedProducts(product, 3),
    getBrands(),
  ]);
  if (!category || !brand) notFound();

  const settings = await getSettings();
  const { policies } = settings;
  const assurances = [
    { icon: "truck" as const, text: `Livraison en ${policies.shippingDelay}, offerte dès ${formatPrice(policies.freeShippingThreshold)}` },
    { icon: "rotate" as const, text: `${policies.returnDays} jours pour changer d'avis, retour gratuit` },
    { icon: "shield" as const, text: `Garantie ${policies.warrantyYears} ans` },
  ];

  return (
    <div className="pb-24 lg:pb-0">
      <Container>
        <Breadcrumbs
          items={[
            { name: category.name, path: categoryPath(category.slug) },
            { name: product.name, path: productPath(product) },
          ]}
        />

        <ProductHero
          product={{
            name: product.name,
            kind: product.kind,
            summary: product.summary,
            highlights: product.highlights,
            variants: product.variants,
            defaultSku: defaultVariant(product).sku,
          }}
          brandName={brand.name}
          assurances={assurances}
        />

        <div className="mt-12 grid gap-12 sm:mt-20 sm:gap-16 lg:grid-cols-[1fr_1.1fr]">
          <section aria-labelledby="presentation">
            <h2 id="presentation" className="text-h2">
              {t.product.description}
            </h2>
            <div className="measure mt-5 space-y-4 leading-relaxed text-fg/90">
              {product.description.map((p) => (
                <p key={p.slice(0, 32)}>{frenchSpacing(p)}</p>
              ))}
            </div>

            <h3 className="mt-10 text-h3">{t.product.inTheBox}</h3>
            <ul className="mt-4 space-y-2">
              {product.inTheBox.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <Icon name="check" size={16} className="text-signal" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="label-mono mt-10 text-muted">
              {t.product.updated}{" "}
              <time dateTime={product.updatedAt}>{formatDate(product.updatedAt)}</time>
            </p>
          </section>

          <section aria-labelledby="specs">
            <h2 id="specs" className="text-h2">
              {t.product.specs}
            </h2>
            <div className="mt-5">
              <SpecTable groups={product.specs} caption={`${t.product.specs} — ${product.name}`} />
            </div>
          </section>
        </div>

        <Faq
          items={product.faq}
          title={`${t.product.faq} sur ${product.name}`}
          className="mt-12 max-w-3xl sm:mt-20"
        />

        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-12 sm:mt-20">
            <h2 id="related" className="text-h2">
              {t.product.related}
            </h2>
            <div className="mt-6">
              <ProductGrid products={related} brands={brands} columns={3} layout="rail" />
            </div>
          </section>
        )}
      </Container>

      <JsonLd data={productJsonLd(product, brand, category, settings)} />
    </div>
  );
}
