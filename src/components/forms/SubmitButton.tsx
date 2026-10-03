"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

/** Bouton d'envoi : désactivé et libellé « en cours » pendant l'action serveur. */
export function SubmitButton({
  children,
  pendingLabel = "Envoi…",
  fullWidth = false,
  danger = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  fullWidth?: boolean;
  /** Action destructive (suppression). */
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      fullWidth={fullWidth}
      className={danger ? "bg-danger hover:bg-danger/90" : undefined}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
