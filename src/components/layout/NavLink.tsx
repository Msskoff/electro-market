"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

/**
 * Lien de navigation principal, souligné quand la section est active.
 * L'icône (décorative) aide à repérer la rubrique ; le libellé reste toujours affiché.
 */
export function NavLink({ href, icon, children }: { href: string; icon?: IconName; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2 whitespace-nowrap py-3 text-sm font-medium transition-colors",
        "after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-accent after:transition-transform after:duration-200",
        active ? "text-fg after:scale-x-100" : "text-muted after:scale-x-0 hover:text-fg",
      )}
    >
      {icon && <Icon name={icon} size={18} className={cn("shrink-0", active ? "text-accent" : "text-muted")} />}
      {children}
    </Link>
  );
}
