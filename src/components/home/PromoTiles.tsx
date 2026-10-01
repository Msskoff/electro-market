import Link from "next/link";
import { DeviceIllustration } from "@/components/product/DeviceIllustration";
import { Icon } from "@/components/ui/Icon";
import { categoryPath, defaultVariant } from "@/lib/catalog/selectors";
import type { Category, Product } from "@/lib/catalog/types";

const tones = ["bg-tile-sage", "bg-tile-sand", "bg-tile-sky"];

/** Trois encarts éditoriaux menant aux catégories phares. */
export function PromoTiles({ categories, products }: { categories: Category[]; products: Product[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
      {categories.slice(0, 3).map((c, i) => (
        <li key={c.slug} className="w-[84%] shrink-0 snap-start md:w-auto">
          <Link
            href={categoryPath(c.slug)}
            className={`group relative flex h-full min-h-36 items-center overflow-hidden rounded-xl ${tones[i]} p-5 transition-shadow hover:shadow-md sm:min-h-44 sm:p-6`}
          >
            <div className="relative z-10 max-w-[58%]">
              <p className="eyebrow text-muted">{c.name}</p>
              <h3 className="mt-2 text-h3 sm:text-h2">{c.tagline}</h3>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                Découvrir
                <Icon name="arrowRight" size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </div>
            <div className="absolute right-3 top-1/2 w-[38%] max-w-44 -translate-y-1/2 transition-transform duration-300 ease-out group-hover:scale-105">
              {(() => {
                const product = products.find((p) => p.category === c.slug);
                return product ? (
                  <DeviceIllustration kind={product.kind} color={defaultVariant(product).color.hex} className="text-fg" />
                ) : null;
              })()}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
