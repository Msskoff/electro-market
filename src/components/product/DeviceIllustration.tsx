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
          <stop offset="0" stopColor="#0c1a14" />
          <stop offset="0.55" stopColor="#173d2e" />
          <stop offset="1" stopColor="#4f9a74" />
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

      {kind === "tablet" && (
        <g>
          <rect x="36" y="24" width="128" height="160" rx="14" fill={dark} />
          <rect x="41" y="29" width="118" height="150" rx="10" fill={screen} />
          <circle cx="100" cy="26.5" r="1.4" fill="#05070a" />
          <rect x="54" y="150" width="60" height="3.5" rx="1.75" fill="#fff" opacity="0.35" />
          <rect x="54" y="159" width="38" height="3.5" rx="1.75" fill="#fff" opacity="0.2" />
          <rect x="166" y="60" width="5" height="64" rx="2.5" fill={color} />
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

      {kind === "watch" && (
        <g>
          <rect x="78" y="14" width="44" height="54" rx="10" fill={color} />
          <rect x="78" y="132" width="44" height="54" rx="10" fill={color} />
          <rect x="62" y="52" width="76" height="96" rx="24" fill={dark} />
          <rect x="68" y="58" width="64" height="84" rx="19" fill={screen} />
          <rect x="138" y="84" width="6" height="20" rx="3" fill={dark} />
          <circle cx="100" cy="100" r="2.5" fill="#fff" opacity="0.9" />
          <rect x="99" y="76" width="2" height="25" rx="1" fill="#fff" opacity="0.9" />
          <rect x="99" y="99" width="2" height="18" rx="1" fill="#fff" opacity="0.7" transform="rotate(-60 100 100)" />
          <circle cx="100" cy="66" r="1.5" fill="#7fc4a0" />
        </g>
      )}

      {kind === "headphones" && (
        <g>
          <path d="M50 112a50 56 0 0 1 100 0" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" />
          <path d="M50 112a50 56 0 0 1 100 0" fill="none" stroke={light} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <rect x="30" y="98" width="38" height="66" rx="17" fill={`url(#${id}-body)`} />
          <rect x="132" y="98" width="38" height="66" rx="17" fill={`url(#${id}-body)`} />
          <rect x="60" y="106" width="12" height="50" rx="6" fill={dark} />
          <rect x="128" y="106" width="12" height="50" rx="6" fill={dark} />
        </g>
      )}

      {kind === "earbuds" && (
        <g>
          <rect x="50" y="98" width="100" height="74" rx="32" fill={`url(#${id}-body)`} />
          <path d="M52 124h96" stroke={dark} strokeWidth="1.5" opacity="0.5" />
          <circle cx="100" cy="148" r="2.5" fill="#7fc4a0" />
          <g>
            <circle cx="78" cy="62" r="17" fill={color} stroke={dark} strokeWidth="1" />
            <rect x="72" y="66" width="11" height="34" rx="5.5" fill={color} stroke={dark} strokeWidth="1" />
            <circle cx="124" cy="58" r="17" fill={color} stroke={dark} strokeWidth="1" />
            <rect x="118" y="62" width="11" height="34" rx="5.5" fill={color} stroke={dark} strokeWidth="1" />
          </g>
        </g>
      )}
    </svg>
  );
}
