import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

/**
 * Pictogramme ElectroMarket : étiquette de prix orange dont le « M » forme un chariot.
 * Redessiné en SVG d'après le logo officiel (net à toutes les tailles, ~1 Ko).
 * Couleurs : --brand-orange / --brand-navy (tokens.css). Proportions 432 × 270.
 */
export function LogoMark({ height = 32, className }: { height?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 432 270"
      height={height}
      width={(height * 432) / 270}
      aria-hidden
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <path d="M113 0H404a28 28 0 0 1 28 28V242a28 28 0 0 1-28 28H113L0 135Z" fill="var(--brand-orange)" />
      <circle cx="96" cy="135" r="22" fill="#fff" />
      <path
        d="M179 200V57l83 94 83-94v143"
        fill="none"
        stroke="#fff"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="262" cy="151" r="15" fill="#fff" />
      {[180, 345].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="224" r="33" fill="#fff" />
          <circle cx={cx} cy="224" r="17" fill="var(--brand-navy)" />
        </g>
      ))}
    </svg>
  );
}

/**
 * Logo complet : pictogramme + « Electro » (orange) « Market » (bleu nuit).
 * Le nom est du vrai texte (lisible par les robots, net, sans image à charger).
 * `inverse` pour les fonds sombres : « Market » passe en blanc.
 */
export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center gap-2 sm:gap-2.5", className)}
      aria-label={`${siteConfig.name} — accueil`}
    >
      <LogoMark height={30} className="sm:h-[34px] sm:w-[54px]" />
      <span aria-hidden className="text-xl font-bold leading-none tracking-tight sm:text-2xl">
        <span className="text-brand-orange">Electro</span>
        <span className={inverse ? "text-on-inverse" : "text-brand-navy"}>Market</span>
      </span>
    </Link>
  );
}
