import Link from "next/link";
import { categoryTile } from "@/components/catalog/categoryTheme";
import { kindIcon } from "@/components/product/kindIcon";
import { Icon, type IconName } from "@/components/ui/Icon";
import { categoryPath } from "@/lib/catalog/selectors";
import type { Category } from "@/lib/catalog/types";
import { t } from "@/lib/i18n/fr";


function Circle({ href, label, icon, tile, meta }: { href: string; label: string; icon: IconName; tile: string; meta?: string }) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2 text-center sm:gap-3">
      <span
        className={`flex size-16 items-center justify-center rounded-full ${tile} text-accent ring-1 ring-border transition-transform duration-200 ease-out group-hover:-translate-y-1 sm:size-24`}
      >
        <Icon name={icon} size={30} strokeWidth={1.25} />
      </span>
      <span className="text-xs font-semibold leading-tight sm:text-sm">
        {label}
        {meta && <span className="mt-0.5 hidden text-xs font-normal text-muted sm:block">{meta}</span>}
      </span>
    </Link>
  );
}

/** Accès rapide aux catégories, en pastilles rondes. */
export function CategoryCircles({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  return (
    <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-6 sm:gap-x-4 sm:gap-y-8 sm:overflow-visible sm:px-0">
      {categories.map((c, i) => (
        <li key={c.slug} className="w-[76px] shrink-0 sm:w-auto">
          <Circle
            href={categoryPath(c.slug)}
            label={c.name}
            icon={kindIcon[c.kind]}
            tile={categoryTile(i)}
            meta={`${counts[c.slug] ?? 0} réf.`}
          />
        </li>
      ))}
      <li className="w-[76px] shrink-0 sm:w-auto">
        <Circle href="/guides" label={t.nav.guides} icon="book" tile="bg-surface" meta="Conseils" />
      </li>
    </ul>
  );
}
