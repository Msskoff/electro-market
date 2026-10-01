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
    "radial-gradient(circle at 80% 20%, #E2EADB 0%, #F6F4EE 60%)";

  const element: ReactElement = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#F6F4EE",
        backgroundImage: grid,
        color: "#16211B",
        padding: 64,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#1D4A37",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: visual ? 640 : 1000 }}>
          <div style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#1D4A37" }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, marginTop: 16 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 28, color: "#5C665F", marginTop: 20 }}>{subtitle}</div>}
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
