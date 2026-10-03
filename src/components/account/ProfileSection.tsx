"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { fieldErrors, profileSchema, type AccountData } from "@/lib/account/schema";
import { saveAccount } from "@/lib/account/store";
import { Field } from "./Field";

/** « Mes informations » : affichage, puis formulaire de modification. */
export function ProfileSection({ account }: { account: AccountData }) {
  const { profile } = account;
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const showForm = editing || !profile;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = profileSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      setStatus("");
      return;
    }
    setErrors({});
    const ok = saveAccount({ ...account, profile: result.data });
    setStatus(ok ? "Informations enregistrées." : "Enregistrement impossible : le stockage de ce navigateur est désactivé.");
    if (ok) setEditing(false);
  }

  return (
    <div>
      {showForm ? (
        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field idPrefix="profil" name="firstName" label="Prénom" autoComplete="given-name" defaultValue={profile?.firstName} error={errors.firstName} required />
          <Field idPrefix="profil" name="lastName" label="Nom" autoComplete="family-name" defaultValue={profile?.lastName} error={errors.lastName} required />
          <Field
            idPrefix="profil"
            name="phone"
            label="Téléphone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            hint="Pour vous joindre lors de la livraison. Ex. 90 12 34 56"
            defaultValue={profile?.phone}
            error={errors.phone}
            required
          />
          <Field idPrefix="profil" name="email" label="E-mail" type="email" autoComplete="email" optional defaultValue={profile?.email} error={errors.email} />
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit">Enregistrer</Button>
            {profile && (
              <Button type="button" variant="ghost" onClick={() => { setEditing(false); setErrors({}); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <dl className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {[
              ["Nom", `${profile.firstName} ${profile.lastName}`],
              ["Téléphone", profile.phone],
              ["E-mail", profile.email || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="font-medium tabular">{v}</dd>
              </div>
            ))}
          </dl>
          <Button variant="secondary" size="sm" onClick={() => { setEditing(true); setStatus(""); }}>
            <Icon name="edit" size={16} />
            Modifier
          </Button>
        </div>
      )}
      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-signal">
        {status}
      </p>
    </div>
  );
}
