import type { ReactNode } from "react";
import { Faq } from "@/components/content/Faq";
import { TrustBar } from "@/components/content/TrustBar";
import { CategoryCircles } from "@/components/home/CategoryCircles";
import { HelpBand } from "@/components/home/HelpBand";
import { HeroShowcase, type ShowcaseSlide } from "@/components/home/hero/HeroShowcase";
import { PromoTiles } from "@/components/home/PromoTiles";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { getAllProducts, getBrands, getCategories, getVerifiedReviews } from "@/lib/catalog/repository";
import { categoryPath, defaultVariant, discountPercent, priceRange, productPath } from "@/lib/catalog/selectors";
import type { Category, Product } from "@/lib/catalog/types";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSettings } from "@/lib/settings/repository";
import { siteFaqItems, type HeroSlide } from "@/lib/settings/types";
import { formatPrice } from "@/lib/utils/format";

export async function generateMetadata() {
  const { policies } = await getSettings();
  return buildMetadata({
    title: `${siteConfig.name} — Smartphones et ordinateurs portables à Lomé`,
    description: `Smartphones et ordinateurs portables neufs à Lomé : fiches techniques détaillées, prix en francs CFA, livraison en ${policies.shippingDelay.replace(/ à Lomé$/, "")} et garantie ${policies.warrantyYears} ans.`,
    path: "/",
    absoluteTitle: true,
  });
}

function SectionTitle({ id, children, action }: { id: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 id={id} className="flex items-center gap-2 text-h2">
        {children}
      </h2>
      {action}
    </div>
  );
}

/** « l'Aurion One 5G », « le Nuvia Book 14 Air » (smartphones et ordinateurs : masculin). */
function withArticle(name: string): string {
  return /^[aeiouyhéè]/i.test(name) ? `l'${name}` : `le ${name}`;
}

/** Associe chaque diapositive éditoriale à son produit et à sa catégorie réels. */
function buildShowcase(heroSlides: HeroSlide[], products: Product[], categories: Category[]): ShowcaseSlide[] {
  return heroSlides.flatMap((slide) => {
    const product = products.find((p) => p.category === slide.categorySlug && p.slug === slide.productSlug);
    const category = categories.find((c) => c.slug === slide.categorySlug);
    if (!product || !category) return [];
    const variant = defaultVariant(product);
    const { min, max } = priceRange(product);
    return [
      {
        ...slide,
        categoryName: category.name,
        categoryHref: categoryPath(category.slug),
        productName: product.name,
        productHref: productPath(product),
        productCta: withArticle(product.name),
        kind: product.kind,
        color: variant.color.hex,
        priceLabel: min === max ? formatPrice(min) : `à partir de ${formatPrice(min)}`,
        discount: discountPercent(variant),
      },
    ];
  });
}

export default async function HomePage() {
  const [categories, products, brands, reviews, settings] = await Promise.all([
    getCategories(),
    getAllProducts(),
    getBrands(),
    getVerifiedReviews(),
    getSettings(),
  ]);
  const counts = Object.fromEntries(
    categories.map((c) => [c.slug, products.filter((p) => p.category === c.slug).length]),
  );
  // Produits mis en avant d'abord, puis le reste du catalogue.
  const selection = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 8);

  return (
    <div className="space-y-10 sm:space-y-16">
      <HeroShowcase slides={buildShowcase(settings.heroSlides, products, categories)} />

      <Container as="section" aria-label="Catégories">
        <CategoryCircles categories={categories} counts={counts} />
      </Container>

      <Container as="section" aria-labelledby="selection-title" className="reveal">
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-8">
          <SectionTitle id="selection-title">
            Notre sélection
            <Icon name="sparkle" size={20} className="text-star" />
          </SectionTitle>
          <p className="mt-2 hidden text-muted sm:block">Des appareils que nous conseillerions à un proche, dans chaque catégorie.</p>
          <div className="mt-4 sm:mt-6">
            <ProductGrid products={selection} brands={brands} layout="rail" />
          </div>
        </div>
      </Container>

      <Container as="section" aria-label="Nos univers" className="reveal">
        <PromoTiles categories={categories} products={products} />
      </Container>

      {reviews.length > 0 && (
        <Container>
          <ReviewsSection reviews={reviews} />
        </Container>
      )}

      <Container className="reveal">
        <HelpBand />
      </Container>

      <Container className="reveal max-w-3xl">
        <Faq items={siteFaqItems(settings)} />
      </Container>

      <Container as="section" aria-label="Nos engagements" className="reveal">
        <TrustBar />
      </Container>
    </div>
  );
}
