"use client";

import { useMemo, useState } from "react";
import { SpecChip } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { StockStatus } from "@/components/ui/StockStatus";
import { Icon } from "@/components/ui/Icon";
import { defaultVariant } from "@/lib/catalog/selectors";
import type { Product, Variant } from "@/lib/catalog/types";
import { AddToCartButton } from "./AddToCartButton";
import { DeviceIllustration } from "./DeviceIllustration";
import { OptionGroup } from "./OptionGroup";
import { frenchSpacing } from "@/lib/utils/typography";

interface ProductHeroProps {
  product: Product;
  brandName: string;
  /** Lignes de réassurance (livraison, retours, garantie) issues de la config. */
  assurances: { icon: "truck" | "rotate" | "shield"; text: string }[];
}

/**
 * En-tête de fiche produit : visuel + bloc d'achat.
 * Composant client pour la sélection de variante, mais intégralement rendu
 * côté serveur au premier affichage (nom, prix, stock visibles sans JS).
 */
export function ProductHero({ product, brandName, assurances }: ProductHeroProps) {
  const [variant, setVariant] = useState<Variant>(() => defaultVariant(product));

  const options = useMemo(
    () => [...new Set(product.variants.map((v) => v.option).filter((o): o is string => !!o))],
    [product.variants],
  );
  const colors = useMemo(() => {
    const map = new Map<string, Variant["color"]>();
    product.variants.forEach((v) => map.set(v.color.name, v.color));
    return [...map.values()];
  }, [product.variants]);

  /** Choisit la variante correspondant à la combinaison, en conservant au mieux l'autre attribut. */
  function select(next: { option?: string; color?: string }) {
    const option = next.option ?? variant.option;
    const color = next.color ?? variant.color.name;
    const exact = product.variants.find((v) => v.option === option && v.color.name === color);
    const fallback = product.variants.find((v) =>
      next.color ? v.color.name === color : v.option === option,
    );
    const chosen = exact ?? fallback;
    if (chosen) setVariant(chosen);
  }

  const visualLabel = `${product.name}, coloris ${variant.color.name}`;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        {/* Visuel */}
        <div className="bg-glow relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2 p-10 lg:sticky lg:top-24 lg:self-start">
          <span className="label-mono absolute left-4 top-4 text-muted">{variant.sku}</span>
          <span className="label-mono absolute bottom-4 right-4 text-muted">{variant.color.name}</span>
          <DeviceIllustration
            kind={product.kind}
            color={variant.color.hex}
            label={visualLabel}
            className="max-w-[78%] text-fg"
          />
        </div>

        {/* Bloc d'achat */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="eyebrow text-accent">{brandName}</p>
            <h1 className="mt-2 text-h1">{product.name}</h1>
            <p className="measure mt-4 text-base leading-relaxed text-muted">{frenchSpacing(product.summary)}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Caractéristiques clés">
              {product.highlights.map((h) => (
                <li key={h}>
                  <SpecChip>{h}</SpecChip>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Price amount={variant.price} compareAt={variant.compareAtPrice} size="lg" />
              <StockStatus stock={variant.stock} />
            </div>
            <p className="mt-1 text-xs text-muted">Prix TTC en francs CFA.</p>

            <div className="mt-6 flex flex-col gap-5">
              {options.length > 1 && (
                <OptionGroup
                  legend="Configuration"
                  value={variant.option ?? ""}
                  items={options.map((o) => ({
                    value: o,
                    label: o,
                    available: product.variants.some(
                      (v) => v.option === o && v.color.name === variant.color.name,
                    ),
                  }))}
                  onChange={(option) => select({ option })}
                />
              )}
              {colors.length > 1 && (
                <OptionGroup
                  legend={`Couleur : ${variant.color.name}`}
                  value={variant.color.name}
                  items={colors.map((c) => ({
                    value: c.name,
                    label: c.name,
                    swatch: c.hex,
                    available: product.variants.some(
                      (v) => v.color.name === c.name && v.option === variant.option,
                    ),
                  }))}
                  onChange={(color) => select({ color })}
                />
              )}
            </div>

            <div className="mt-6">
              <AddToCartButton key={variant.sku} sku={variant.sku} disabled={variant.stock <= 0} />
            </div>

            <ul className="mt-6 grid gap-3 border-t border-border pt-5 text-sm">
              {assurances.map((a) => (
                <li key={a.text} className="flex items-center gap-3 text-muted">
                  <Icon name={a.icon} className="shrink-0 text-fg" />
                  {a.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Barre d'achat collante sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <Price amount={variant.price} size="sm" />
          </div>
          <AddToCartButton key={variant.sku} sku={variant.sku} disabled={variant.stock <= 0} compact />
        </div>
      </div>
    </>
  );
}
