import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { getAllProducts, getCategories } from "@/lib/catalog/repository";
import { categoryPagePath, pageCount } from "@/lib/catalog/pagination";
import { categoryPath, productPath } from "@/lib/catalog/selectors";

/** Sitemap généré depuis le catalogue : toute nouvelle page publique y apparaît automatiquement. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);

  const latest = (dates: string[]) => (dates.length ? dates.sort().at(-1) : undefined);
  const categoryUpdated = (slug: string) =>
    latest(products.filter((p) => p.category === slug).map((p) => p.updatedAt));

  return [
    { url: absoluteUrl("/"), lastModified: latest(products.map((p) => p.updatedAt)), priority: 1 },
    ...categories.map((c) => ({
      url: absoluteUrl(categoryPath(c.slug)),
      lastModified: categoryUpdated(c.slug),
      priority: 0.8,
    })),
    ...categories.flatMap((c) => {
      const total = pageCount(products.filter((p) => p.category === c.slug).length);
      return Array.from({ length: total - 1 }, (_, i) => ({
        url: absoluteUrl(categoryPagePath(c.slug, i + 2)),
        lastModified: categoryUpdated(c.slug),
        priority: 0.5,
      }));
    }),
    ...products.map((p) => ({
      url: absoluteUrl(productPath(p)),
      lastModified: p.updatedAt,
      priority: 0.7,
    })),
    { url: absoluteUrl("/faq"), priority: 0.4 },
  ];
}
