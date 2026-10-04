import { PageviewTracker } from "@/components/analytics/Analytics";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { t } from "@/lib/i18n/fr";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { getSettings } from "@/lib/settings/repository";

/** Mise en page de la boutique publique : en-tête, contenu, pied de page, identité schema.org. */
export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.nav.skipToContent}
      </a>
      <SiteHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd()]} />
      <PageviewTracker />
    </>
  );
}
