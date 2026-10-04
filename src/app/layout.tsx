import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { jetbrainsMono, poppins } from "./fonts";
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
  themeColor: [{ color: "#121316" }],
};

/** Squelette HTML commun. En-tête, pied de page et JSON-LD : (shop)/layout.tsx ; l'administration a sa propre mise en page. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.language}
      className={cn(poppins.variable, jetbrainsMono.variable, "antialiased")}
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
