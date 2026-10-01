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
    <article className="group relative flex w-full flex-col rounded-xl border border-border bg-surface p-3 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-surface-2 p-6 min-[480px]:aspect-square">
        <DeviceIllustration
          kind={product.kind}
          color={variant.color.hex}
          className="max-h-full w-auto max-w-[78%] text-fg transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
        {discount > 0 && singlePrice && (
          <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-on-accent tabular">
            {t.product.discount(discount)}
          </span>
        )}
        {colors.length > 1 && (
          <ul className="absolute bottom-3 right-3 flex -space-x-1" aria-label={`${colors.length} coloris`}>
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
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-1.5 pb-1 pt-4">
        <div>
          <p className="eyebrow text-muted">{brandName}</p>
          <Heading className="mt-1 font-sans text-base font-semibold leading-snug tracking-normal">
            <Link
              href={productPath(product)}
              className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
            >
              {product.name}
            </Link>
          </Heading>
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-label="Caractéristiques clés">
          {product.highlights.map((h) => (
            <li key={h}>
              <SpecChip>{h}</SpecChip>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
          <div className="min-w-0">
            {!singlePrice && <p className="text-xs text-muted">{t.product.from}</p>}
            <Price amount={min} compareAt={singlePrice ? variant.compareAtPrice : undefined} size="sm" />
            <StockStatus stock={totalStock(product)} className="mt-1 text-xs" />
          </div>
          {variant.stock > 0 && (
            <QuickAddButton sku={variant.sku} label={`${product.name} (${variant.label})`} />
          )}
        </div>
      </div>
    </article>
  );
}
