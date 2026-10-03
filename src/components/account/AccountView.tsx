"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { getAccountServerSnapshot, getAccountSnapshot, clearAccount, subscribeToAccount } from "@/lib/account/store";
import { AddressesSection } from "./AddressesSection";
import { ProfileSection } from "./ProfileSection";

export interface CartSummary {
  itemCount: number;
  total: string;
  names: string[];
}

const SECTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "profil", label: "Mes informations", icon: "user" },
  { id: "adresses", label: "Mes adresses", icon: "mapPin" },
  { id: "commandes", label: "Mes commandes", icon: "package" },
  { id: "panier", label: "Mon panier", icon: "cart" },
  { id: "donnees", label: "Mes données", icon: "lock" },
];

const noop = () => () => {};

function Section({ id, title, icon, children }: { id: string; title: string; icon: IconName; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="scroll-mt-28 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 id={`${id}-titre`} className="flex items-center gap-2.5 text-h3">
        <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name={icon} size={18} />
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Espace client : tout ce qui concerne le client, au même endroit. */
export function AccountView({ cart }: { cart: CartSummary }) {
  const account = useSyncExternalStore(subscribeToAccount, getAccountSnapshot, getAccountServerSnapshot);
  // Les données vivent sur l'appareil : on attend l'hydratation pour éviter un affichage trompeur.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { profile, addresses } = account;

  const overview = [
    { label: "Commandes", value: "0", href: "#commandes" },
    { label: "Panier", value: `${cart.itemCount} article${cart.itemCount > 1 ? "s" : ""}`, href: "#panier" },
    { label: "Adresses", value: String(addresses.length), href: "#adresses" },
    { label: "Profil", value: profile ? "Complet" : "À compléter", href: "#profil" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
      {/* Navigation : pastilles défilantes sur mobile, menu latéral collant en grand écran */}
      <nav aria-label="Sections du compte" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                className="flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium transition-colors hover:border-accent hover:text-accent lg:rounded-md lg:border-transparent lg:bg-transparent lg:px-3 lg:hover:bg-surface"
              >
                <Icon name={s.icon} size={16} className="text-muted" />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-4 sm:space-y-6">
        {/* Bienvenue + aperçu */}
        <div className="rounded-xl bg-inverse p-5 text-on-inverse sm:p-6">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-on-accent">
              {hydrated && profile ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : <Icon name="user" size={24} />}
            </span>
            <div className="min-w-0">
              <p className="text-h3 font-display">
                {hydrated && profile ? `Bonjour ${profile.firstName}` : "Bienvenue"}
              </p>
              <p className="text-sm text-on-inverse-muted">
                {hydrated && profile ? profile.phone : "Complétez votre profil pour commander plus vite."}
              </p>
            </div>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {overview.map((o) => (
              <li key={o.label}>
                <a href={o.href} className="block rounded-lg bg-on-inverse/10 px-3 py-2.5 transition-colors hover:bg-on-inverse/15">
                  <span className="block text-xs text-on-inverse-muted">{o.label}</span>
                  <span className="mt-0.5 block font-semibold tabular">
                    {hydrated || o.label === "Panier" || o.label === "Commandes" ? o.value : "…"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
          <Icon name="lock" size={16} className="mt-0.5 shrink-0" />
          <span>
            Version de démonstration : vos informations sont enregistrées <strong className="font-semibold text-fg">uniquement sur cet appareil</strong>.
            La connexion à un compte en ligne arrivera avec le paiement.
          </span>
        </p>

        <Section id="profil" title="Mes informations" icon="user">
          {hydrated ? <ProfileSection account={account} /> : <p className="text-muted">Chargement…</p>}
        </Section>

        <Section id="adresses" title="Mes adresses de livraison" icon="mapPin">
          {hydrated ? <AddressesSection account={account} /> : <p className="text-muted">Chargement…</p>}
        </Section>

        <Section id="commandes" title="Mes commandes" icon="package">
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted">
              Aucune commande pour l&apos;instant. Le paiement en ligne sera activé prochainement : vos commandes et leur
              suivi de livraison apparaîtront ici.
            </p>
            <ButtonLink href="/smartphones" variant="secondary" size="sm">
              Découvrir les produits
            </ButtonLink>
          </div>
        </Section>

        <Section id="panier" title="Mon panier" icon="cart">
          {cart.itemCount === 0 ? (
            <p className="text-muted">Votre panier est vide.</p>
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {cart.itemCount} article{cart.itemCount > 1 ? "s" : ""} · <span className="tabular">{cart.total}</span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{cart.names.join(", ")}</p>
              </div>
              <ButtonLink href="/panier" size="sm">
                Voir mon panier
                <Icon name="arrowRight" size={16} />
              </ButtonLink>
            </div>
          )}
        </Section>

        <Section id="donnees" title="Mes données personnelles" icon="lock">
          <p className="text-muted">
            Vous pouvez effacer à tout moment les informations et adresses enregistrées sur cet appareil. Votre panier
            n&apos;est pas concerné.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {confirmClear ? (
              <>
                <Button size="sm" className="bg-danger hover:bg-danger" onClick={() => { clearAccount(); setConfirmClear(false); }}>
                  Confirmer l&apos;effacement
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                  Annuler
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setConfirmClear(true)} disabled={!profile && addresses.length === 0}>
                <Icon name="trash" size={16} />
                Effacer mes informations
              </Button>
            )}
          </div>
          <p className="mt-3 text-sm">
            <Link href="/faq" className="font-medium text-accent underline-offset-4 hover:underline">
              Une question ? Consultez l&apos;aide
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
}
