import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

const STEPS = ["Panier", "Identification", "Livraison et paiement"] as const;

/**
 * Repère de progression du parcours d'achat. `current` : index de l'étape en cours (0 à 2).
 * Les étapes passées sont cochées ; l'étape en cours est annoncée aux lecteurs d'écran.
 */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <nav aria-label="Étapes de la commande" className="mb-6">
      <ol className="flex items-center gap-2 text-xs font-medium sm:gap-3 sm:text-sm">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex min-w-0 items-center gap-2 sm:gap-3">
              {i > 0 && <span aria-hidden className={cn("h-px w-4 shrink-0 sm:w-8", done || active ? "bg-accent" : "bg-border-strong")} />}
              <span aria-current={active ? "step" : undefined} className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done && "bg-accent text-on-accent",
                    active && "bg-accent text-on-accent ring-4 ring-accent-soft",
                    !done && !active && "bg-surface-2 text-muted",
                  )}
                >
                  {done ? <Icon name="check" size={14} /> : i + 1}
                </span>
                <span className={cn("truncate", active ? "text-fg" : "text-muted", !active && "hidden sm:inline")}>{label}</span>
                {done && <span className="sr-only"> (terminé)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
