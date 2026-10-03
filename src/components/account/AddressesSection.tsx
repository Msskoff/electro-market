"use client";

import { useActionState, useState, useTransition } from "react";
import { Field } from "@/components/forms/Field";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/lib/account/actions";
import { MAX_ADDRESSES, type Address } from "@/lib/account/schema";
import type { FormState } from "@/lib/auth/schema";

function AddressForm({ initial, onDone }: { initial?: Address; onDone: () => void }) {
  const [state, action] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await saveAddress(prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});
  const v = state.values;

  return (
    <form action={action} noValidate className="grid gap-4 rounded-lg border border-border bg-surface-2 p-4 sm:grid-cols-2 sm:p-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <FormAlert message={state.message} className="sm:col-span-2" />
      <Field idPrefix="adresse" name="label" label="Nom de l'adresse" placeholder="Domicile, Bureau…" required defaultValue={v?.label ?? initial?.label} error={state.errors?.label} />
      <Field idPrefix="adresse" name="phone" label="Téléphone sur place" type="tel" inputMode="tel" autoComplete="tel" required defaultValue={v?.phone ?? initial?.phone} error={state.errors?.phone} />
      <Field idPrefix="adresse" name="district" label="Quartier" placeholder="Bè, Tokoin, Agoè…" required defaultValue={v?.district ?? initial?.district} error={state.errors?.district} />
      <Field idPrefix="adresse" name="city" label="Ville" required defaultValue={v?.city ?? initial?.city ?? siteConfig.contact.address.city} error={state.errors?.city} />
      <Field
        idPrefix="adresse"
        name="landmark"
        label="Point de repère"
        optional
        hint="Ex. derrière la pharmacie, portail bleu"
        defaultValue={v?.landmark ?? initial?.landmark}
        error={state.errors?.landmark}
        className="sm:col-span-2"
      />
      <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
        <input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} className="size-5 accent-accent" />
        Utiliser comme adresse de livraison par défaut
      </label>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <SubmitButton pendingLabel="Enregistrement…">Enregistrer l&apos;adresse</SubmitButton>
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/** « Mes adresses » : adresses de livraison (quartier + point de repère, usage local). */
export function AddressesSection({ addresses }: { addresses: Address[] }) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<FormState>) {
    startTransition(async () => {
      const result = await task();
      setError(result.ok ? undefined : result.message);
      setConfirmDelete(null);
    });
  }

  return (
    <div className="space-y-3">
      <FormAlert message={error} />
      {addresses.length === 0 && editingId !== "new" && (
        <p className="text-muted">Aucune adresse enregistrée. Ajoutez-en une pour gagner du temps lors de la commande.</p>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {addresses.map((a) =>
          editingId === a.id ? (
            <li key={a.id} className="md:col-span-2">
              <AddressForm initial={a} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={a.id} className="rounded-lg border border-border bg-surface p-4">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {a.label}
                {a.isDefault && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Par défaut</span>}
              </p>
              <p className="mt-1 text-sm text-muted">
                {a.district}, {a.city}
                {a.landmark && (
                  <>
                    <br />
                    {a.landmark}
                  </>
                )}
              </p>
              <p className="mt-1 text-sm tabular">{a.phone}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditingId(a.id)} disabled={pending}>
                  <Icon name="edit" size={16} />
                  Modifier
                </Button>
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => setDefaultAddress(a.id))}>
                    Définir par défaut
                  </Button>
                )}
                {confirmDelete === a.id ? (
                  <Button variant="ghost" size="sm" className="text-danger" disabled={pending} onClick={() => run(() => deleteAddress(a.id))}>
                    Confirmer la suppression
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmDelete(a.id)} aria-label={`Supprimer l'adresse ${a.label}`}>
                    <Icon name="trash" size={16} />
                    Supprimer
                  </Button>
                )}
              </div>
            </li>
          ),
        )}
      </ul>

      {editingId === "new" ? (
        <AddressForm onDone={() => setEditingId(null)} />
      ) : (
        addresses.length < MAX_ADDRESSES && (
          <Button variant="secondary" onClick={() => setEditingId("new")} disabled={editingId !== null}>
            <Icon name="plus" size={18} />
            Ajouter une adresse
          </Button>
        )
      )}
    </div>
  );
}
