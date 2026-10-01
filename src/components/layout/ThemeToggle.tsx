"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/fr";

export const THEME_STORAGE_KEY = "vx_theme";

/**
 * Script exécuté dans <head> AVANT le premier rendu : applique le thème mémorisé
 * sans flash. Sans préférence enregistrée, on suit `prefers-color-scheme`.
 * (Si JavaScript est désactivé, la media query de tokens.css prend le relais.)
 */
export const themeInitScript = `(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}if(t!=="light"&&t!=="dark")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.setAttribute("data-theme",t)})()`;

type Theme = "light" | "dark";

function getTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  media.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);

  function toggle() {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* stockage indisponible : le thème reste valable pour la session */
    }
  }

  const label = theme === "dark" ? t.theme.toLight : t.theme.toDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {/* Avant hydratation, on affiche les deux icônes via CSS pour éviter tout décalage. */}
      <Icon name="moon" className="dark:hidden" />
      <Icon name="sun" className="hidden dark:block" />
    </button>
  );
}
