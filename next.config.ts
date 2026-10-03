import type { NextConfig } from "next";

/** En-têtes de sécurité appliqués à toutes les réponses. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
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
