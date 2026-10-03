"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

export const adminNavItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Tableau de bord", icon: "grid" },
  { href: "/admin/produits", label: "Produits", icon: "package" },
  { href: "/admin/categories", label: "Catégories", icon: "layers" },
  { href: "/admin/marques", label: "Marques", icon: "tag" },
  { href: "/admin/configuration", label: "Configuration", icon: "settings" },
  { href: "/admin/clients", label: "Clients", icon: "users" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Barre latérale verticale (grand écran) : pastilles d'icônes, libellé en infobulle. */
export function AdminSideNav() {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col items-center gap-2">
      {adminNavItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex size-12 items-center justify-center rounded-full transition-colors duration-150",
                active ? "bg-inverse text-on-inverse" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon name={item.icon} size={22} />
              <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-inverse px-2.5 py-1 text-xs font-medium text-on-inverse group-hover:block group-focus-visible:block">
                {item.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Barre de navigation basse (mobile) : icône + libellé court. */
export function AdminBottomNav() {
  const pathname = usePathname();
  return (
    <ul className="grid grid-cols-6">
      {adminNavItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs font-medium leading-none",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Icon name={item.icon} size={20} />
              <span className="max-w-full truncate px-0.5">{item.label.split(" ")[0]}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
