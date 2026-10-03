"use client";

import { useActionState, useState } from "react";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { deleteAccount } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/schema";

/** Suppression définitive du compte, en deux étapes (droit à l'effacement). */
export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useActionState<FormState>(() => deleteAccount(), {});

  if (!confirming) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
        <Icon name="trash" size={16} />
        Supprimer mon compte
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-lg border border-danger/40 bg-danger-soft p-4">
      <p className="text-sm">
        <strong className="font-semibold">Action définitive.</strong> Votre compte, votre profil et vos adresses seront
        supprimés. Votre panier sur cet appareil n&apos;est pas concerné.
      </p>
      <FormAlert message={state.message} />
      <div className="flex flex-wrap gap-3">
        <SubmitButton danger pendingLabel="Suppression…">Oui, supprimer définitivement</SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
