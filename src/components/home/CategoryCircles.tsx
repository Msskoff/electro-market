import Link from "next/link";
import { categoryTile } from "@/components/catalog/categoryTheme";
import { kindIcon } from "@/components/product/kindIcon";
import { Icon, type IconName } from "@/components/ui/Icon";
import { categoryPath } from "@/lib/catalog/selectors";
import type { Category } from "@/lib/catalog/types";
import { t } from "@/lib/i18n/fr";


function Circle({ href, label, icon, tile, meta }: { href: string; label: string; icon: IconName; tile: string; meta?: string }) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-3 text-center">
      <span
        className={`flex size-20 items-center justify-center rounded-full ${tile} text-accent ring-1 ring-border transition-transform duration-200 ease-out group-hover:-translate-y-1 sm:size-24`}
      >
        <Icon name={icon} size={34} strokeWidth={1.25} />
      </span>
      <span className="text-sm font-semibold leading-tight">
        {label}
        {meta && <span className="mt-0.5 block text-xs font-normal text-muted">{meta}</span>}
      </span>
    </Link>
  );
}

/** Accès rapide aux catégories, en pastilles rondes. */
export function CategoryCircles({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  return (
    <ul className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-6">
      {categories.map((c, i) => (
        <li key={c.slug}>
          <Circle
            href={categoryPath(c.slug)}
            label={c.name}
            icon={kindIcon[c.kind]}
            tile={categoryTile(i)}
            meta={`${counts[c.slug] ?? 0} réf.`}
          />
        </li>
      ))}
      <li>
        <Circle href="/guides" label={t.nav.guides} icon="book" tile="bg-surface" meta="Conseils" />
      </li>
    </ul>
  );
}
