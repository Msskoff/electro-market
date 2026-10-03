import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/fr";

/** Accès à l'espace client (profil, adresses, commandes, panier). */
export function AccountLink() {
  return (
    <Link
      href="/compte"
      aria-label={t.nav.account}
      className="inline-flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
    >
      <Icon name="user" size={24} />
      <span className="hidden sm:block">Compte</span>
    </Link>
  );
}
