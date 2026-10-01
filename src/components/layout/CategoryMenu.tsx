"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/fr";

export interface CategoryMenuItem {
  href: string;
  label: string;
  icon: IconName;
}

/**
 * Menu « Toutes les catégories » basé sur <details> : utilisable sans JS,
 * refermé automatiquement après navigation, clic extérieur ou Échap.
 */
export function CategoryMenu({ items }: { items: CategoryMenuItem[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className="group relative shrink-0">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2.5 rounded-md bg-accent px-4 text-sm font-medium text-on-accent transition-colors hover:bg-accent-strong [&::-webkit-details-marker]:hidden">
        <Icon name="menu" size={18} />
        <span>{t.nav.allCategories}</span>
        <Icon name="chevronDown" size={16} className="transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <ul className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-surface p-2 shadow-md">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-surface-2"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon name={item.icon} size={16} />
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
