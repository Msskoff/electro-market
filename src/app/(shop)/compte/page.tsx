import { AccountView } from "@/components/account/AccountView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { getAccount } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth/session";
import { getCart } from "@/lib/cart/queries";
import { listMyOrders } from "@/lib/orders/queries";
import { t } from "@/lib/i18n/fr";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatPrice } from "@/lib/utils/format";

/** Espace client : privé, réservé aux clients connectés, jamais indexé. */
export const metadata = buildMetadata({
  title: t.nav.account,
  description: "Votre profil, vos adresses de livraison, vos commandes et votre panier.",
  path: "/compte",
  noindex: true,
});

export default async function AccountPage({ searchParams }: PageProps<"/compte">) {
  const user = await requireUser("/compte");
  const [{ profile, addresses }, cart, orders, params] = await Promise.all([getAccount(user.id), getCart(), listMyOrders(), searchParams]);
  const notice = params["mot-de-passe"] === "modifie" ? "Votre mot de passe a été modifié." : undefined;

  return (
    <Container className="pb-12">
      <Breadcrumbs items={[{ name: t.nav.account, path: "/compte" }]} />
      <h1 className="text-h1">{t.nav.account}</h1>
      <p className="mt-2 text-muted">Profil, adresses de livraison, commandes et panier : tout au même endroit.</p>
      <div className="mt-6 sm:mt-8">
        <AccountView
          email={user.email}
          profile={profile}
          addresses={addresses}
          notice={notice}
          orders={orders}
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
