import Link from "next/link";
import type { ReactNode } from "react";
import { FormAlert } from "@/components/forms/FormAlert";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { Address, Profile } from "@/lib/account/schema";
import { signOut } from "@/lib/auth/actions";
import { AddressesSection } from "./AddressesSection";
import { DeleteAccount } from "./DeleteAccount";
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
  { id: "securite", label: "Sécurité et données", icon: "lock" },
];

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

/** Espace client : tout ce qui concerne le client connecté, au même endroit. */
export function AccountView({
  email,
  profile,
  addresses,
  cart,
  notice,
}: {
  email: string;
  profile: Profile;
  addresses: Address[];
  cart: CartSummary;
  notice?: string;
}) {
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  const complete = Boolean(profile.firstName && profile.lastName && profile.phone);

  const overview = [
    { label: "Commandes", value: "0", href: "#commandes" },
    { label: "Panier", value: `${cart.itemCount} article${cart.itemCount > 1 ? "s" : ""}`, href: "#panier" },
    { label: "Adresses", value: String(addresses.length), href: "#adresses" },
    { label: "Profil", value: complete ? "Complet" : "À compléter", href: "#profil" },
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
        <FormAlert ok message={notice} />

        {/* Bienvenue + aperçu */}
        <div className="rounded-xl bg-inverse p-5 text-on-inverse sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-on-accent">
              {initials || <Icon name="user" size={24} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-h3">{profile.firstName ? `Bonjour ${profile.firstName}` : "Bienvenue"}</p>
              <p className="truncate text-sm text-on-inverse-muted">{email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-full border border-on-inverse/30 px-4 text-sm font-semibold transition-colors hover:bg-on-inverse/10"
              >
                Se déconnecter
              </button>
            </form>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {overview.map((o) => (
              <li key={o.label}>
                <a href={o.href} className="block rounded-lg bg-on-inverse/10 px-3 py-2.5 transition-colors hover:bg-on-inverse/15">
                  <span className="block text-xs text-on-inverse-muted">{o.label}</span>
                  <span className="mt-0.5 block font-semibold tabular">{o.value}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Section id="profil" title="Mes informations" icon="user">
          <ProfileSection profile={profile} email={email} />
        </Section>

        <Section id="adresses" title="Mes adresses de livraison" icon="mapPin">
          <AddressesSection addresses={addresses} />
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

        <Section id="securite" title="Sécurité et données personnelles" icon="lock">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted">Mot de passe du compte</p>
              <ButtonLink href="/reinitialiser-mot-de-passe" variant="secondary" size="sm">
                Modifier mon mot de passe
              </ButtonLink>
            </div>
            <div className="border-t border-border pt-5">
              <p className="text-muted">
                Vous pouvez supprimer votre compte à tout moment : votre profil et vos adresses sont effacés
                définitivement.
              </p>
              <div className="mt-3">
                <DeleteAccount />
              </div>
            </div>
            <p className="text-sm">
              <Link href="/faq" className="font-medium text-accent underline-offset-4 hover:underline">
                Une question ? Consultez l&apos;aide
              </Link>
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
