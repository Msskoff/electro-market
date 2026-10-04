"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

export const adminNavItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Tableau de bord", icon: "grid" },
  { href: "/admin/commandes", label: "Commandes", icon: "receipt" },
  { href: "/admin/statistiques", label: "Statistiques", icon: "chart" },
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
export function AdminSideNav({ pending = 0 }: { pending?: number }) {
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
              {item.href === "/admin/commandes" && <Badge count={pending} />}
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

/** Onglets toujours visibles sur mobile ; le reste est dans « Plus ». */
const MOBILE_MAIN: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Accueil", icon: "grid" },
  { href: "/admin/commandes", label: "Commandes", icon: "receipt" },
  { href: "/admin/produits", label: "Produits", icon: "package" },
  { href: "/admin/statistiques", label: "Stats", icon: "chart" },
];
const MOBILE_MORE = adminNavItems.filter((i) => !MOBILE_MAIN.some((m) => m.href === i.href));

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold leading-none text-on-accent tabular">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function TabItem({ active, icon, label, badge = 0 }: { active: boolean; icon: IconName; label: string; badge?: number }) {
  return (
    <>
      <span className={cn("relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150", active ? "bg-accent-soft text-accent" : "text-muted")}>
        <Icon name={icon} size={22} />
        <Badge count={badge} />
      </span>
      <span className={cn("text-xs leading-none", active ? "font-semibold text-fg" : "font-medium text-muted")}>{label}</span>
    </>
  );
}

/**
 * Barre de navigation basse (mobile) : 4 onglets fixes avec libellé, pastille sur
 * l'onglet actif, compteur des commandes à traiter, et « Plus » (autres pages,
 * boutique, déconnexion) dans un panneau qui se referme à la navigation.
 */
export function AdminBottomNav({ pending = 0, signOut }: { pending?: number; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  // Fermeture automatique quand la page change.
  if (open && openedAt !== pathname) setOpen(false);
  const moreActive = MOBILE_MORE.some((i) => isActive(pathname, i.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <>
          <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-inverse/40" />
          <div id="admin-plus" className="pop-in fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 rounded-xl bg-surface p-3 shadow-lg">
            <ul className="grid grid-cols-2 gap-2">
              {MOBILE_MORE.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold", active ? "bg-accent-soft text-accent" : "bg-surface-2 text-fg")}
                    >
                      <Icon name={item.icon} size={20} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2">
              <Link href="/" target="_blank" aria-label="Voir la boutique (nouvel onglet)" className="flex h-12 items-center gap-3 whitespace-nowrap rounded-lg px-3 text-sm font-semibold text-muted">
                <Icon name="external" size={20} />
                Boutique
              </Link>
              <form action={signOut}>
                <button type="submit" className="flex h-12 w-full items-center justify-start gap-3 whitespace-nowrap rounded-lg px-3 text-sm font-semibold text-danger">
                  <Icon name="logout" size={20} />
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </>
      )}
      <ul className="relative z-40 grid grid-cols-5 bg-surface" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {MOBILE_MAIN.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} aria-label={pending && item.href === "/admin/commandes" ? `${item.label} (${pending} à traiter)` : undefined} className="flex flex-col items-center gap-1 pb-2 pt-2.5">
                <TabItem active={active} icon={item.icon} label={item.label} badge={item.href === "/admin/commandes" ? pending : 0} />
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="admin-plus"
            onClick={() => {
              setOpenedAt(pathname);
              setOpen((o) => !o);
            }}
            className="flex w-full flex-col items-center gap-1 pb-2 pt-2.5"
          >
            <TabItem active={open || moreActive} icon={open ? "close" : "menu"} label="Plus" />
          </button>
        </li>
      </ul>
    </>
  );
}
