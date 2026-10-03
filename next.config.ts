import type { NextConfig } from "next";

/** En-têtes de sécurité appliqués à toutes les réponses. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** Photos produit hébergées dans le stockage Supabase (bucket public). */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  /**
   * Photos produit : AVIF (≈ 20 % plus léger que WebP) puis WebP selon le navigateur,
   * à la taille d'affichage réelle (srcset + `sizes`). Pas de largeur > 1 600 px :
   * inutile pour une photo produit, et autant de variantes en moins à générer.
   */
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1280, 1600],
    imageSizes: [48, 64, 96, 128, 256, 384],
    qualities: [60, 75],
    // Une photo modifiée doit changer d'URL (nom de fichier versionné) : cache long sans risque.
    minimumCacheTTL: 2_678_400, // 31 jours
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /**
   * Catégories retirées du catalogue (la boutique ne vend plus que smartphones et
   * ordinateurs portables) : redirection permanente plutôt que des 404 en masse.
   */
  async redirects() {
    // Catégories retirées + rubrique « Guides d'achat » supprimée.
    const retired = ["audio", "tablettes", "montres-connectees", "guides"];
    return retired.flatMap((slug) => [
      { source: `/${slug}`, destination: "/", permanent: true },
      { source: `/${slug}/:path*`, destination: "/", permanent: true },
    ]);
  },
};

export default nextConfig;
