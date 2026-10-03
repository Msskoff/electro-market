import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

/** Message de résultat d'un formulaire, annoncé aux lecteurs d'écran. */
export function FormAlert({ ok, message, className }: { ok?: boolean; message?: string; className?: string }) {
  return (
    <div role={ok ? "status" : "alert"} aria-live="polite" className={className}>
      {message && (
        <p
          className={cn(
            "flex items-start gap-2 rounded-md px-3.5 py-3 text-sm",
            ok ? "bg-signal-soft text-signal" : "bg-danger-soft text-danger",
          )}
        >
          <Icon name={ok ? "check" : "close"} size={16} className="mt-0.5 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}
