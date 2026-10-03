"use client";

import { useState } from "react";
import { AddressForm } from "@/components/account/AddressesSection";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MAX_ADDRESSES } from "@/lib/account/limits";
import type { Address } from "@/lib/account/schema";
import { cn } from "@/lib/utils/cn";

/**
 * Choix de l'adresse de livraison au moment de la commande : un toucher pour choisir,
 * ajout d'une adresse sans quitter la page (enregistrée aussi dans le compte).
 */
export function CheckoutDelivery({ addresses }: { addresses: Address[] }) {
  const [selected, setSelected] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id);
  const [adding, setAdding] = useState(addresses.length === 0);

  return (
    <div className="space-y-3">
      {addresses.length > 0 && (
        <fieldset>
          <legend className="sr-only">Adresse de livraison</legend>
          <ul className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => {
              const checked = selected === a.id;
              return (
                <li key={a.id}>
                  <label
                    className={cn(
                      "flex h-full cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                      checked ? "border-accent bg-accent-soft/50 ring-1 ring-accent" : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="adresse"
                      value={a.id}
                      checked={checked}
                      onChange={() => setSelected(a.id)}
                      className="mt-1 size-5 shrink-0 accent-accent"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold">{a.label}</span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {a.district}, {a.city}
                        {a.landmark && ` · ${a.landmark}`}
                      </span>
                      <span className="mt-0.5 block text-sm tabular">{a.phone}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {adding ? (
        <div>
          {addresses.length === 0 && (
            <p className="mb-3 text-sm text-muted">
              Où devons-nous vous livrer ? Cette adresse sera aussi enregistrée dans votre compte.
            </p>
          )}
          <AddressForm onDone={() => setAdding(false)} />
        </div>
      ) : (
        addresses.length < MAX_ADDRESSES && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} />
            Livrer à une autre adresse
          </Button>
        )
      )}
    </div>
  );
}
