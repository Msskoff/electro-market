import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutDelivery } from "@/components/checkout/CheckoutDelivery";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { getAccount } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth/session";
import { getCart } from "@/lib/cart/queries";
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

export default async function CheckoutPage() {
  const user = await requireUser("/commande");
  const [cart, { profile, addresses }] = await Promise.all([getCart(), getAccount(user.id)]);
  if (cart.lines.length === 0) redirect("/panier");

  return (
    <Container className="pb-12">
      <Breadcrumbs items={[{ name: t.cart.title, path: "/panier" }, { name: "Commande", path: "/commande" }]} />
      <CheckoutSteps current={2} />
      <h1 className="text-h1">Finaliser ma commande</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="min-w-0 space-y-4 sm:space-y-6">
          <Step n={1} title="Adresse de livraison">
            <CheckoutDelivery addresses={addresses} />
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Icon name="truck" size={16} className="shrink-0" />
              Livraison {siteConfig.policies.shippingDelay}.
            </p>
          </Step>

          <Step n={2} title="Paiement">
            <p className="text-muted">{t.cart.checkoutSoon} Votre panier et votre adresse restent enregistrés d&apos;ici là.</p>
          </Step>
        </div>

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
          {/* Paiement non branché : aucun prestataire choisi (PAYMENT_PROVIDER), tests E2E requis (CLAUDE.md §13). */}
          <Button size="lg" fullWidth className="mt-5" disabled aria-describedby="paiement-note">
            Payer {formatPrice(cart.total)}
          </Button>
          <p id="paiement-note" className="mt-2 text-center text-xs text-muted">
            {t.cart.checkoutSoon}
          </p>
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
