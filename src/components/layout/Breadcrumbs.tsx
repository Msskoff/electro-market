import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { t } from "@/lib/i18n/fr";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo/jsonld";

/**
 * Fil d'Ariane visible + BreadcrumbList JSON-LD générés à partir de la même source,
 * ce qui garantit leur cohérence.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const crumbs: Crumb[] = [{ name: t.nav.home, path: "/" }, ...items];
  return (
    <>
      <nav aria-label={t.nav.breadcrumb} className="py-5">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-fg">
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.path} className="hover:text-fg hover:underline underline-offset-4">
                      {c.name}
                    </Link>
                    <span aria-hidden className="text-border-strong">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
