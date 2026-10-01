import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

export function LogoMark({ size = 36, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="9" fill={inverse ? "var(--on-inverse)" : "var(--accent)"} />
      <path
        d="M10 8h12v3.4h-8.1v2.9h7v3.3h-7v3h8.1V24H10z"
        fill={inverse ? "var(--inverse)" : "var(--on-accent)"}
      />
    </svg>
  );
}

/** Logo complet : pictogramme + nom + signature. `inverse` pour les fonds sombres. */
export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center gap-2.5", className)}
      aria-label={`${siteConfig.name} — accueil`}
    >
      <LogoMark inverse={inverse} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.375rem] font-semibold tracking-tight">{siteConfig.name}</span>
        <span
          className={cn(
            "mt-1 text-xs font-medium",
            inverse ? "text-on-inverse-muted" : "text-muted",
          )}
        >
          Électronique · Lomé
        </span>
      </span>
    </Link>
  );
}
