"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormAlert } from "@/components/forms/FormAlert";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Address } from "@/lib/account/schema";
import { placeOrder } from "@/lib/orders/actions";
import type { PaymentMethodId } from "@/lib/orders/status";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { CheckoutDelivery } from "./CheckoutDelivery";
import { CopyButton } from "./CopyButton";

export interface PublicPaymentMethod {
  id: PaymentMethodId;
  label: string;
  number: string;
  accountName: string;
  instructions: string;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`etape-${n}`} className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 id={`etape-${n}`} className="flex items-center gap-3 text-h3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * Finalisation : adresse, moyen de paiement, validation. Le montant envoyé n'est
 * qu'un contrôle : la base recalcule tout et refuse si le prix a changé entre-temps.
 */
export function CheckoutForm({
  addresses,
  methods,
  total,
  shippingDelay,
}: {
  addresses: Address[];
  methods: PublicPaymentMethod[];
  total: number;
  shippingDelay: string;
}) {
  const router = useRouter();
  const [address, setAddress] = useState<string | undefined>();
  const [method, setMethod] = useState<PaymentMethodId | undefined>(methods.length === 1 ? methods[0].id : undefined);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  // Adresse par défaut tant que le client n'en a pas choisi une autre (y compris une adresse ajoutée à l'instant).
  const selectedAddress = address ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id;
  const chosen = methods.find((m) => m.id === method);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!selectedAddress) return setError("Ajoutez une adresse de livraison.");
    if (!method) return setError("Choisissez un moyen de paiement.");
    startTransition(async () => {
      const result = await placeOrder({ addressId: selectedAddress, method, note, expectedTotal: total });
      if (!result.ok) {
        setError(result.error);
        router.refresh(); // prix ou stock modifiés : le récapitulatif se met à jour
        return;
      }
      router.push(`/compte/commandes/${result.number}?nouvelle=1`);
    });
  }

  return (
    <form onSubmit={submit} className="min-w-0 space-y-4 sm:space-y-6" noValidate>
      <Step n={1} title="Adresse de livraison">
        <CheckoutDelivery addresses={addresses} selected={selectedAddress} onSelect={setAddress} />
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Icon name="truck" size={16} className="shrink-0" />
          Livraison {shippingDelay}.
        </p>
      </Step>

      <Step n={2} title="Paiement">
        {methods.length === 0 ? (
          <p className="text-muted">Aucun moyen de paiement n&apos;est disponible pour le moment. Contactez-nous pour commander.</p>
        ) : (
          <fieldset>
            <legend className="sr-only">Moyen de paiement</legend>
            <ul className="grid gap-3">
              {methods.map((m) => {
                const checked = method === m.id;
                const mobile = m.id !== "cod";
                return (
                  <li key={m.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                        checked ? "border-accent bg-accent-soft/50 ring-1 ring-accent" : "border-border bg-surface hover:border-border-strong",
                      )}
                    >
                      <input type="radio" name="paiement" value={m.id} checked={checked} onChange={() => setMethod(m.id)} className="mt-1 size-5 shrink-0 accent-accent" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold">
                          <Icon name={mobile ? "phone" : "wallet"} size={18} className="text-muted" />
                          {m.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted">
                          {mobile ? "Paiement mobile, puis envoi de la preuve" : "Vous payez à la réception"}
                        </span>
                      </span>
                    </label>

                    {/* Au choix d'un mobile money : numéro, montant et marche à suivre. */}
                    {checked && mobile && (
                      <div className="pop-in mt-2 rounded-lg border border-border bg-surface-2 p-4 text-sm">
                        <p className="text-muted">Numéro à créditer</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <span className="text-h3 font-bold tabular tracking-wide">{m.number}</span>
                          <CopyButton value={m.number.replace(/\s/g, "")} label="Copier" />
                        </div>
                        {m.accountName && (
                          <p className="mt-2">
                            Titulaire : <strong>{m.accountName}</strong>
                          </p>
                        )}
                        <p className="mt-2">
                          Montant exact : <strong className="tabular">{formatPrice(total)}</strong>
                        </p>
                        <p className="mt-3 text-muted">{m.instructions}</p>
                        <p className="mt-3 flex items-start gap-2 font-medium">
                          <Icon name="upload" size={16} className="mt-0.5 shrink-0 text-accent" />
                          Après validation de la commande, déposez la capture de votre paiement (date, référence et montant) sur la page de suivi.
                        </p>
                      </div>
                    )}
                    {checked && !mobile && <p className="pop-in mt-2 rounded-lg bg-surface-2 p-4 text-sm text-muted">{m.instructions}</p>}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}

        <div className="mt-5">
          <label htmlFor="commande-note" className="block text-sm font-medium">
            Précision pour la livraison <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <textarea
            id="commande-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            className="mt-1.5 w-full rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-base focus:border-accent focus:outline-none"
            placeholder="Ex. : appeler en arrivant au portail bleu"
          />
        </div>
      </Step>

      <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <p className="mb-3 flex items-baseline justify-between text-base font-semibold">
          <span>Total à payer</span>
          <span className="tabular">{formatPrice(total)}</span>
        </p>
        <FormAlert message={error} className="mb-3" />
        <Button type="submit" size="lg" fullWidth disabled={pending || methods.length === 0}>
          {pending ? (
            "Validation…"
          ) : (
            <>
              Valider la commande<span className="hidden sm:inline"> · {formatPrice(total)}</span>
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">
          {chosen && chosen.id !== "cod"
            ? "Les articles sont réservés pour vous dès la validation."
            : "Vous paierez à la livraison. Les articles sont réservés pour vous dès la validation."}
        </p>
      </div>
    </form>
  );
}
