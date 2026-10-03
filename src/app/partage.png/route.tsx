import { siteConfig } from "@/config/site";
import { renderOgImage } from "@/lib/seo/og";

/** Image de partage par défaut du site, à URL stable (/partage.png). */
export const dynamic = "force-static";

export function GET() {
  return renderOgImage({
    eyebrow: "Boutique d'électronique",
    title: siteConfig.tagline,
    subtitle: "Smartphones et ordinateurs portables, à Lomé.",
  });
}
