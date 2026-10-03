"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { addressSchema, fieldErrors, type AccountData, type Address } from "@/lib/account/schema";
import { saveAccount } from "@/lib/account/store";
import { Field } from "./Field";

const MAX_ADDRESSES = 10;

/** Un seul « par défaut » : la première adresse l'est d'office. */
function withSingleDefault(addresses: Address[], defaultId?: string): Address[] {
  const target = defaultId ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id;
  return addresses.map((a) => ({ ...a, isDefault: a.id === target }));
}

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Address;
  onSave: (address: Address) => void;
  onCancel: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = addressSchema.safeParse({
      ...Object.fromEntries(form),
      id: initial?.id ?? crypto.randomUUID(),
      isDefault: form.get("isDefault") === "on",
    });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    onSave(result.data);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-lg border border-border bg-surface-2 p-4 sm:grid-cols-2 sm:p-5">
      <Field idPrefix="adresse" name="label" label="Nom de l'adresse" placeholder="Domicile, Bureau…" defaultValue={initial?.label} error={errors.label} required />
      <Field
        idPrefix="adresse"
        name="phone"
        label="Téléphone sur place"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={initial?.phone}
        error={errors.phone}
        required
      />
      <Field idPrefix="adresse" name="district" label="Quartier" placeholder="Bè, Tokoin, Agoè…" defaultValue={initial?.district} error={errors.district} required />
      <Field idPrefix="adresse" name="city" label="Ville" defaultValue={initial?.city ?? siteConfig.contact.address.city} error={errors.city} required />
      <Field
        idPrefix="adresse"
        name="landmark"
        label="Point de repère"
        optional
        hint="Ex. derrière la pharmacie, portail bleu"
        defaultValue={initial?.landmark}
        error={errors.landmark}
        className="sm:col-span-2"
      />
      <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
        <input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} className="size-5 accent-accent" />
        Utiliser comme adresse de livraison par défaut
      </label>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit">Enregistrer l&apos;adresse</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/** « Mes adresses » : adresses de livraison (quartier + point de repère, usage local). */
export function AddressesSection({ account }: { account: AccountData }) {
  const { addresses } = account;
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function persist(next: Address[], defaultId?: string) {
    saveAccount({ ...account, addresses: withSingleDefault(next, defaultId) });
  }

  function save(address: Address) {
    const exists = addresses.some((a) => a.id === address.id);
    const next = exists ? addresses.map((a) => (a.id === address.id ? address : a)) : [...addresses, address];
    persist(next, address.isDefault ? address.id : undefined);
    setEditingId(null);
  }

  return (
    <div className="space-y-3">
      {addresses.length === 0 && editingId !== "new" && (
        <p className="text-muted">Aucune adresse enregistrée. Ajoutez-en une pour gagner du temps lors de la commande.</p>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {addresses.map((a) =>
          editingId === a.id ? (
            <li key={a.id} className="md:col-span-2">
              <AddressForm initial={a} onSave={save} onCancel={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={a.id} className="rounded-lg border border-border bg-surface p-4">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {a.label}
                {a.isDefault && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Par défaut</span>}
              </p>
              <p className="mt-1 text-sm text-muted">
                {a.district}, {a.city}
                {a.landmark && <><br />{a.landmark}</>}
              </p>
              <p className="mt-1 text-sm tabular">{a.phone}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditingId(a.id)}>
                  <Icon name="edit" size={16} />
                  Modifier
                </Button>
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => persist(addresses, a.id)}>
                    Définir par défaut
                  </Button>
                )}
                {confirmDelete === a.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    onClick={() => { persist(addresses.filter((x) => x.id !== a.id)); setConfirmDelete(null); }}
                  >
                    Confirmer la suppression
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(a.id)} aria-label={`Supprimer l'adresse ${a.label}`}>
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
        <AddressForm onSave={save} onCancel={() => setEditingId(null)} />
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
