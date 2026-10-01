import Link from "next/link";
import { SpecChip } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { StockStatus } from "@/components/ui/StockStatus";
import {
  defaultVariant,
  discountPercent,
  priceRange,
  productPath,
  totalStock,
  uniqueColors,
} from "@/lib/catalog/selectors";
import type { Product } from "@/lib/catalog/types";
import { t } from "@/lib/i18n/fr";
import { DeviceIllustration } from "./DeviceIllustration";
import { QuickAddButton } from "./QuickAddButton";

interface ProductCardProps {
  product: Product;
  brandName: string;
  /** Niveau de titre selon le contexte de la page (h2 sur une catégorie, h3 dans une section). */
  headingLevel?: "h2" | "h3";
}

/**
 * Carte produit réutilisable. Toute la carte est cliquable via un lien étiré
 * (un seul lien par carte = meilleure accessibilité et maillage interne propre) ;
 * seul le bouton d'ajout rapide est posé au-dessus.
 */
export function ProductCard({ product, brandName, headingLevel: Heading = "h3" }: ProductCardProps) {
  const variant = defaultVariant(product);
  const { min, max } = priceRange(product);
  const colors = uniqueColors(product);
  const discount = discountPercent(variant);
  const singlePrice = min === max;

  return (
    <article className="group relative flex w-full flex-col rounded-xl border border-border bg-surface p-2 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md sm:p-3">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface-2 p-4 sm:p-6">
        <DeviceIllustration
          kind={product.kind}
          color={variant.color.hex}
          className="max-h-full w-auto max-w-[78%] text-fg transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
        {discount > 0 && singlePrice && (
          <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-on-accent tabular sm:left-3 sm:top-3 sm:px-2.5 sm:py-1">
            {t.product.discount(discount)}
          </span>
        )}
        {colors.length > 1 && (
          <ul className="absolute bottom-2.5 left-2.5 flex -space-x-1 sm:bottom-3 sm:left-3" aria-label={`${colors.length} coloris`}>
            {colors.map((c) => (
              <li
                key={c.name}
                title={c.name}
                className="size-4 rounded-full border-2 border-surface"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </ul>
        )}
        {variant.stock > 0 && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
            <QuickAddButton sku={variant.sku} label={`${product.name} (${variant.label})`} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1 pb-1 pt-3 sm:gap-2.5 sm:px-1.5 sm:pt-4">
        <div>
          <p className="eyebrow text-muted">{brandName}</p>
          <Heading className="mt-1 line-clamp-2 font-sans text-sm font-semibold leading-snug tracking-normal sm:text-base">
            <Link
              href={productPath(product)}
              className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
            >
              {product.name}
            </Link>
          </Heading>
        </div>

        {/* Mobile : une seule caractéristique (la plus parlante) ; toutes à partir de 640 px */}
        <ul className="flex flex-wrap gap-1.5" aria-label="Caractéristiques clés">
          {product.highlights.map((h, i) => (
            <li key={h} className={i > 0 ? "hidden sm:block" : undefined}>
              <SpecChip>{h}</SpecChip>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-1">
          {!singlePrice && <p className="text-xs text-muted">{t.product.from}</p>}
          <Price amount={min} compareAt={singlePrice ? variant.compareAtPrice : undefined} size="sm" />
          <StockStatus stock={totalStock(product)} className="mt-1 text-xs" />
        </div>
      </div>
    </article>
  );
}
