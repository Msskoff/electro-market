"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/forms/Field";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { saveProfile } from "@/lib/account/actions";
import type { Profile } from "@/lib/account/schema";
import type { FormState } from "@/lib/auth/schema";

/** « Mes informations » : affichage, puis formulaire de modification (enregistré dans le compte). */
export function ProfileSection({ profile, email }: { profile: Profile; email: string }) {
  const complete = Boolean(profile.firstName && profile.lastName && profile.phone);
  const [editing, setEditing] = useState(!complete);
  const [state, action] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await saveProfile(prev, formData);
    if (result.ok) setEditing(false);
    return result;
  }, {});

  if (!editing) {
    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <dl className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {[
              ["Nom", `${profile.firstName} ${profile.lastName}`],
              ["Téléphone", profile.phone ?? "—"],
              ["E-mail", email],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="font-medium tabular break-all">{v}</dd>
              </div>
            ))}
          </dl>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} />
            Modifier
          </Button>
        </div>
        <FormAlert ok message={state.ok ? state.message : undefined} className="mt-3" />
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-2">
      <FormAlert message={state.ok ? undefined : state.message} className="sm:col-span-2" />
      <Field idPrefix="profil" name="firstName" label="Prénom" autoComplete="given-name" required defaultValue={state.values?.firstName ?? profile.firstName} error={state.errors?.firstName} />
      <Field idPrefix="profil" name="lastName" label="Nom" autoComplete="family-name" required defaultValue={state.values?.lastName ?? profile.lastName} error={state.errors?.lastName} />
      <Field
        idPrefix="profil"
        name="phone"
        label="Téléphone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="Pour vous joindre lors de la livraison. Ex. 90 12 34 56"
        required
        defaultValue={state.values?.phone ?? profile.phone ?? ""}
        error={state.errors?.phone}
      />
      <div>
        <p className="text-sm font-medium">E-mail</p>
        <p className="mt-1.5 flex h-11 items-center break-all text-muted">{email}</p>
      </div>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
        {complete && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
