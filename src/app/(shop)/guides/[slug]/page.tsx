import { notFound } from "next/navigation";
import { Faq } from "@/components/content/Faq";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { getBrands, getProductsByCategory } from "@/lib/catalog/repository";
import { getGuide, getGuides } from "@/lib/content/guides";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDate } from "@/lib/utils/format";
import { frenchSpacing } from "@/lib/utils/typography";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: "article",
  });
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const [products, brands] = await Promise.all([getProductsByCategory(guide.category), getBrands()]);
  const path = `/guides/${guide.slug}`;

  return (
    <Container>
      <Breadcrumbs
        items={[
          { name: "Guides d'achat", path: "/guides" },
          { name: guide.title, path },
        ]}
      />

      <article className="mx-auto max-w-3xl pb-10">
        <header className="border-b border-border pb-8">
          <p className="eyebrow text-accent">Guide d&apos;achat</p>
          <h1 className="mt-3 text-h1">{guide.title}</h1>
          <p className="measure mt-5 text-lg leading-relaxed text-muted">{frenchSpacing(guide.description)}</p>
          <p className="mt-6 text-sm text-muted">
            Par {guide.author} · Mis à jour le{" "}
            <time dateTime={guide.updatedAt}>{formatDate(guide.updatedAt)}</time>
          </p>
        </header>

        {/* Réponse directe : format privilégié par les moteurs et les assistants IA */}
        <aside aria-label="En bref" className="mt-8 rounded-lg border-l-4 border-accent bg-accent-soft p-6">
          <p className="eyebrow text-accent">En bref</p>
          <p className="measure mt-2 leading-relaxed">{frenchSpacing(guide.tldr)}</p>
        </aside>

        <div className="mt-10 space-y-10">
          {guide.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-h2">{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p.slice(0, 32)} className="measure mt-4 leading-relaxed text-fg/90">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="measure mt-4 list-disc space-y-2 pl-5 marker:text-accent">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {guide.table && (
          <div className="mt-10 overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <caption className="eyebrow px-5 pt-4 text-left text-muted">{guide.table.caption}</caption>
              <thead>
                <tr className="border-b border-border">
                  {guide.table.head.map((h) => (
                    <th key={h} scope="col" className="px-5 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.table.rows.map((row) => (
                  <tr key={row[0]} className="border-b border-border last:border-0">
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="px-5 py-3 font-normal">
                          {cell}
                        </th>
                      ) : (
                        <td key={i} className="px-5 py-3 tabular text-muted">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Faq items={guide.faq} className="mt-14" />
      </article>

      {products.length > 0 && (
        <section aria-labelledby="guide-products" className="border-t border-border py-12">
          <h2 id="guide-products" className="text-2xl font-semibold">
            Les modèles de notre catalogue
          </h2>
          <div className="mt-6">
            <ProductGrid products={products} brands={brands} columns={3} />
          </div>
        </section>
      )}

      <JsonLd
        data={articleJsonLd({
          title: guide.title,
          description: guide.description,
          path,
          author: guide.author,
          publishedAt: guide.publishedAt,
          updatedAt: guide.updatedAt,
        })}
      />
    </Container>
  );
}
