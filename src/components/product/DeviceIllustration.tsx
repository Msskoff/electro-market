import { useId } from "react";
import type { DeviceKind } from "@/lib/catalog/types";
import { cn } from "@/lib/utils/cn";

/**
 * Illustration vectorielle d'un appareil, teintée selon la couleur de la variante.
 * Sert de visuel de remplacement tant que les vraies photos produit ne sont pas
 * disponibles (à remplacer par <ProductImage> basé sur next/image).
 */

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * (1 + amount));
  const g = clamp(((n >> 8) & 255) * (1 + amount));
  const b = clamp((n & 255) * (1 + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

interface DeviceIllustrationProps {
  kind: DeviceKind;
  color: string;
  /** Texte alternatif ; vide = décoratif. */
  label?: string;
  className?: string;
}

export function DeviceIllustration(props: DeviceIllustrationProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return <DeviceIllustrationSvg {...props} id={id} />;
}

/**
 * Variante sans hook (identifiant fourni) : utilisable hors rendu React,
 * par exemple dans la génération d'images Open Graph.
 */
export function DeviceIllustrationSvg({
  kind,
  color,
  label,
  className,
  id,
  size,
}: DeviceIllustrationProps & { id: string; size?: number }) {
  const dark = shade(color, -0.35);
  const light = shade(color, 0.18);
  const screen = `url(#${id}-screen)`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={cn("h-auto w-full", className)}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a0c05" />
          <stop offset="0.55" stopColor="#4a1e08" />
          <stop offset="1" stopColor="#d9732e" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="186" rx="62" ry="5" fill="currentColor" opacity="0.08" />

      {kind === "phone" && (
        <g>
          <g transform="rotate(9 128 100)">
            <rect x="92" y="22" width="68" height="148" rx="14" fill={`url(#${id}-body)`} />
            <rect x="100" y="31" width="26" height="30" rx="8" fill={dark} opacity="0.55" />
            <circle cx="108" cy="40" r="4.5" fill="#0b0f16" />
            <circle cx="118.5" cy="52" r="4.5" fill="#0b0f16" />
          </g>
          <rect x="44" y="26" width="70" height="152" rx="15" fill={dark} />
          <rect x="47.5" y="29.5" width="63" height="145" rx="12" fill={screen} />
          <circle cx="79" cy="38" r="2.6" fill="#05070a" />
          <rect x="58" y="140" width="42" height="3" rx="1.5" fill="#fff" opacity="0.35" />
          <rect x="58" y="148" width="28" height="3" rx="1.5" fill="#fff" opacity="0.2" />
        </g>
      )}

      {kind === "laptop" && (
        <g>
          <rect x="34" y="42" width="132" height="92" rx="7" fill={`url(#${id}-body)`} />
          <rect x="39" y="47" width="122" height="82" rx="3" fill={screen} />
          <path d="M18 138h164l-9 12H27z" fill={color} />
          <path d="M18 138h164v2H18z" fill={light} />
          <rect x="86" y="138" width="28" height="4" rx="2" fill={dark} opacity="0.6" />
          <rect x="52" y="104" width="54" height="3.5" rx="1.75" fill="#fff" opacity="0.35" />
          <rect x="52" y="113" width="34" height="3.5" rx="1.75" fill="#fff" opacity="0.2" />
        </g>
      )}

    </svg>
  );
}
