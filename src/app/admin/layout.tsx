import type { Metadata } from "next";
import Link from "next/link";
import { AdminBottomNav, AdminSideNav } from "@/components/admin/AdminNav";
import { LogoMark } from "@/components/layout/Logo";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/admin/session";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s – Administration ElectronikTogo" },
  robots: { index: false, follow: false },
};

/**
 * Espace d'administration (réservé aux comptes de la table admins).
 * Mise en page propre, sans l'en-tête de la boutique : barre d'icônes verticale,
 * cartes blanches sur fond gris clair.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { firstName, user, supabase } = await requireAdmin();
  // Commandes demandant une action (preuve à vérifier, colis à expédier) : compteur de la navigation.
  const { count: pending } = await supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["payment_review", "to_ship"]);
  const initial = (firstName || user.email).charAt(0).toUpperCase();

  return (
    <div className="theme-admin min-h-dvh bg-surface-2 pb-24 lg:pb-0">
      <div className="mx-auto flex max-w-[1500px] gap-6 p-3 sm:p-5 lg:p-6">
        {/* Barre latérale (grand écran) */}
        <nav aria-label="Administration" className="sticky top-6 hidden h-[calc(100dvh-3rem)] w-[72px] shrink-0 flex-col items-center justify-between rounded-full bg-surface py-4 shadow-sm lg:flex">
          <div className="flex flex-col items-center gap-6">
            <Link href="/admin" aria-label="Tableau de bord ElectronikTogo">
              <LogoMark height={26} />
            </Link>
            <AdminSideNav pending={pending ?? 0} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Link href="/" target="_blank" aria-label="Voir la boutique (nouvel onglet)" className="flex size-12 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
              <Icon name="external" size={20} />
            </Link>
            <form action={signOut}>
              <button type="submit" aria-label="Se déconnecter" className="flex size-12 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger">
                <Icon name="logout" size={20} />
              </button>
            </form>
            <span aria-hidden className="mt-1 flex size-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent">
              {initial}
            </span>
          </div>
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Navigation basse (mobile) */}
      <nav aria-label="Administration" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface shadow-[0_-4px_16px_rgb(0_0_0/0.06)] lg:hidden">
        <AdminBottomNav pending={pending ?? 0} signOut={signOut} />
      </nav>
    </div>
  );
}
