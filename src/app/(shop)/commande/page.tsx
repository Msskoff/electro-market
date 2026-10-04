import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { getAccount } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth/session";
import { getCart } from "@/lib/cart/queries";
import { getSettings } from "@/lib/settings/repository";
import { t } from "@/lib/i18n/fr";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatPrice } from "@/lib/utils/format";

/** Finalisation de la commande : seule étape qui exige d'être identifié. Jamais indexée. */
export const metadata = buildMetadata({
  title: "Finaliser ma commande",
  description: "Adresse de livraison et paiement.",
  path: "/commande",
  noindex: true,
});

export default async function CheckoutPage() {
  const user = await requireUser("/commande");
  const [cart, { profile, addresses }, settings] = await Promise.all([getCart(), getAccount(user.id), getSettings()]);
  if (cart.lines.length === 0) redirect("/panier");

  return (
    <Container className="pb-12">
      <Breadcrumbs items={[{ name: t.cart.title, path: "/panier" }, { name: "Commande", path: "/commande" }]} />
      <CheckoutSteps current={2} />
      <h1 className="text-h1">Finaliser ma commande</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
        <CheckoutForm
          addresses={addresses}
          total={cart.total}
          shippingDelay={settings.policies.shippingDelay}
          // Seuls les moyens actifs, et les mobiles money dont le numéro est renseigné.
          methods={settings.payment.methods
            .filter((m) => m.enabled && (m.id === "cod" || m.number.trim()))
            .map(({ id, label, number, accountName, instructions }) => ({ id, label, number, accountName, instructions }))}
        />

        <aside aria-labelledby="recap" className="h-fit rounded-xl border border-border bg-surface p-4 sm:p-6 lg:sticky lg:top-28">
          <h2 id="recap" className="text-h3">
            Ma commande
          </h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {cart.lines.map((l) => (
              <li key={l.sku} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{l.product.name}</span>
                  <span className="text-muted">
                    {l.variant.label} · × {l.qty}
                  </span>
                </span>
                <span className="shrink-0 tabular">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t.cart.subtotal}</dt>
              <dd className="tabular">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t.cart.shipping}</dt>
              <dd className="tabular">{cart.shipping === 0 ? t.cart.free : formatPrice(cart.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>{t.cart.total}</dt>
              <dd className="tabular">{formatPrice(cart.total)}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-border pt-4 text-sm text-muted">
            <p>
              Commande pour <span className="font-medium text-fg">{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || user.email}</span>
            </p>
            <Link href="/panier" className="mt-2 inline-block font-medium text-accent underline-offset-4 hover:underline">
              Modifier mon panier
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}
