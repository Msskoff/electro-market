import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { siteConfig } from "@/config/site";

export const OG_SIZE = { width: 1200, height: 630 };

interface OgInput {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Prix déjà formaté. */
  price?: string;
  /** Visuel (élément SVG sans hook). */
  visual?: ReactElement;
}

/** Gabarit unique des images de partage (Open Graph / Twitter) et image produit schema.org. */
export function renderOgImage({ eyebrow, title, subtitle, price, visual }: OgInput): ImageResponse {
  const grid =
    "radial-gradient(circle at 80% 20%, #EBE8F3 0%, #F5F6F8 60%)";

  const element: ReactElement = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#F5F6F8",
        backgroundImage: grid,
        color: "#14161A",
        padding: 64,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Logo (mêmes tracés que LogoMark, couleurs en dur : pas de variables CSS ici). */}
          <svg viewBox="0 0 432 270" width={90} height={56}>
            <path d="M113 0H404a28 28 0 0 1 28 28V242a28 28 0 0 1-28 28H113L0 135Z" fill="#ff5a1f" />
            <circle cx="96" cy="135" r="22" fill="#fff" />
            <path d="M179 200V57l83 94 83-94v143" fill="none" stroke="#fff" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="262" cy="151" r="15" fill="#fff" />
            <circle cx="180" cy="224" r="33" fill="#fff" />
            <circle cx="180" cy="224" r="17" fill="#1b1f3b" />
            <circle cx="345" cy="224" r="33" fill="#fff" />
            <circle cx="345" cy="224" r="17" fill="#1b1f3b" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
            <span style={{ color: "#ff5a1f" }}>Electronik</span>
            <span style={{ color: "#1b1f3b" }}>Togo</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: visual ? 640 : 1000 }}>
          <div style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#0B62C4" }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, marginTop: 16 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 28, color: "#5B616C", marginTop: 20 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{price ?? siteConfig.tagline}</div>
      </div>
      {visual && (
        <div
          style={{
            width: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFFFF",
            border: "1px solid #E4E0D5",
            borderRadius: 24,
          }}
        >
          {visual}
        </div>
      )}
    </div>
  );

  return new ImageResponse(element, OG_SIZE);
}
