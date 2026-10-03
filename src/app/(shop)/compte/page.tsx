import { AccountView } from "@/components/account/AccountView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { getCart } from "@/lib/cart/queries";
import { t } from "@/lib/i18n/fr";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatPrice } from "@/lib/utils/format";

/** Espace client : privé, jamais indexé (voir robots.ts). */
export const metadata = buildMetadata({
  title: t.nav.account,
  description: "Votre profil, vos adresses de livraison, vos commandes et votre panier.",
  path: "/compte",
  noindex: true,
});

export default async function AccountPage() {
  // Le panier est lu côté serveur (cookie) : montants toujours recalculés depuis le catalogue.
  const cart = await getCart();

  return (
    <Container className="pb-12">
      <Breadcrumbs items={[{ name: t.nav.account, path: "/compte" }]} />
      <h1 className="text-h1">{t.nav.account}</h1>
      <p className="mt-2 text-muted">Profil, adresses de livraison, commandes et panier : tout au même endroit.</p>
      <div className="mt-6 sm:mt-8">
        <AccountView
          cart={{
            itemCount: cart.itemCount,
            total: formatPrice(cart.total),
            names: cart.lines.map((l) => l.product.name),
          }}
        />
      </div>
    </Container>
  );
}
