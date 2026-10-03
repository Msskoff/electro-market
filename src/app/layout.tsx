import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { t } from "@/lib/i18n/fr";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils/cn";
import { inter, jetbrainsMono, sourceSerif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...(siteConfig.indexable ? {} : { robots: { index: false, follow: false } }),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s – ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // Thème clair uniquement pour l'instant (mode sombre retiré).
  colorScheme: "light",
  themeColor: [
    { color: "#121316" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.language}
      className={cn(inter.variable, sourceSerif.variable, jetbrainsMono.variable, "antialiased")}
    >
      <body className="flex min-h-dvh flex-col">
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
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}
