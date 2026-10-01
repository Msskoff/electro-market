import { absoluteUrl, siteConfig } from "@/config/site";
import { getAllProducts, getCategories } from "@/lib/catalog/repository";
import { categoryPath, defaultVariant, productPath } from "@/lib/catalog/selectors";
import { getGuides } from "@/lib/content/guides";
import { siteFaq } from "@/lib/content/site-faq";
import { formatPrice } from "@/lib/utils/format";

/** Généré au build, régénéré à chaque déploiement : toujours aligné sur le catalogue. */
export const dynamic = "force-static";

/**
 * /llms.txt — présentation de la boutique au format Markdown, destinée aux
 * assistants IA (proposition de standard llmstxt.org).
 */
export async function GET() {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);
  const guides = getGuides();
  const { policies } = siteConfig;

  const body = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## Informations clés",
    "",
    `- Livraison : ${policies.shippingDelay}, ${formatPrice(policies.shippingCost)}, offerte dès ${formatPrice(policies.freeShippingThreshold)}`,
    `- Retours : ${policies.returnDays} jours, gratuits`,
    `- Garantie : ${policies.warrantyYears} ans, produits neufs`,
    `- Prix : TTC, en francs CFA (${siteConfig.currency})`,
    `- Contact : ${siteConfig.contact.email}`,
    "",
    "## Catégories",
    "",
    ...categories.map((c) => `- [${c.name}](${absoluteUrl(categoryPath(c.slug))}): ${c.intro}`),
    "",
    "## Produits phares",
    "",
    `Le catalogue complet (${products.length} références) est consultable sur chaque page de catégorie ci-dessus.`,
    "",
    ...categories.flatMap((c) => products.filter((p) => p.category === c.slug).slice(0, 5)).map((p) => {
      const v = defaultVariant(p);
      const stock = p.variants.some((x) => x.stock > 0) ? "en stock" : "rupture";
      return `- [${p.name}](${absoluteUrl(productPath(p))}): ${p.summary} À partir de ${formatPrice(v.price)}, ${stock}.`;
    }),
    "",
    "## Guides d'achat",
    "",
    ...guides.map((g) => `- [${g.title}](${absoluteUrl(`/guides/${g.slug}`)}): ${g.tldr}`),
    "",
    "## Questions fréquentes",
    "",
    ...siteFaq.map((f) => `- ${f.question} ${f.answer}`),
    "",
    "## Optional",
    "",
    `- [Plan du site](${absoluteUrl("/sitemap.xml")})`,
    `- [Aide](${absoluteUrl("/faq")})`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
