"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface OptionItem {
  value: string;
  label: string;
  /** Pastille de couleur (hex) pour les coloris. */
  swatch?: string;
  /** false = combinaison inexistante avec l'autre attribut sélectionné. */
  available?: boolean;
}

interface OptionGroupProps {
  legend: string;
  value: string;
  items: OptionItem[];
  onChange: (value: string) => void;
}

/**
 * Groupe de choix exclusifs basé sur de vrais boutons radio :
 * navigation clavier native (flèches), annonce correcte par les lecteurs d'écran.
 */
export function OptionGroup({ legend, value, items, onChange }: OptionGroupProps) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const checked = item.value === value;
          return (
            <label
              key={item.value}
              className={cn(
                "relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3.5 text-sm transition-colors duration-150",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                checked
                  ? "border-fg bg-surface-2 font-medium"
                  : "border-border hover:border-border-strong",
                item.available === false && !checked && "text-muted",
              )}
            >
              <input
                type="radio"
                name={name}
                value={item.value}
                checked={checked}
                onChange={() => onChange(item.value)}
                className="sr-only"
              />
              {item.swatch && (
                <span
                  aria-hidden
                  className="size-4 rounded-full border border-border-strong"
                  style={{ backgroundColor: item.swatch }}
                />
              )}
              {item.label}
              {item.available === false && <span className="sr-only">(autre configuration)</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
