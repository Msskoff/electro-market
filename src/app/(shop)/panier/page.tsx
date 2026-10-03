import Link from "next/link";
import { CartLineControls } from "@/components/cart/CartLineControls";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductThumb } from "@/components/product/ProductVisual";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getSessionUser } from "@/lib/auth/session";
import { Container } from "@/components/ui/Container";
import { getCart } from "@/lib/cart/queries";
import { primaryImage, productPath } from "@/lib/catalog/selectors";
import { t } from "@/lib/i18n/fr";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatPrice } from "@/lib/utils/format";

export const metadata = buildMetadata({
  title: t.cart.title,
  description: "Votre panier.",
  path: "/panier",
  noindex: true,
});

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCart(), getSessionUser()]);

  return (
    <Container className="pb-12">
      <Breadcrumbs items={[{ name: t.cart.title, path: "/panier" }]} />
      {cart.lines.length > 0 && <CheckoutSteps current={0} />}
      <h1 className="text-h1">{t.cart.title}</h1>

      {cart.lines.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border-strong p-12 text-center">
          <p className="text-muted">{t.cart.empty}</p>
          <ButtonLink href="/" className="mt-6">
            {t.cart.continue}
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="h-fit divide-y divide-border rounded-lg border border-border bg-surface">
            {cart.lines.map((line) => (
              <li key={line.sku} className="flex gap-5 p-5">
                <div className="bg-glow flex size-24 shrink-0 items-center justify-center rounded-md bg-surface-2 p-2">
                  <ProductThumb image={primaryImage(line.product, line.variant)} kind={line.product.kind} color={line.variant.color.hex} size={96} className="text-fg" />
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={productPath(line.product)} className="font-medium hover:text-accent">
                        {line.product.name}
                      </Link>
                      <p className="text-sm text-muted">{line.variant.label}</p>
                      <p className="label-mono mt-1 text-muted">{line.sku}</p>
                    </div>
                    <p className="font-display font-semibold tabular">{formatPrice(line.lineTotal)}</p>
                  </div>
                  <CartLineControls
                    sku={line.sku}
                    qty={line.qty}
                    max={line.variant.stock}
                    productName={line.product.name}
                  />
                  {line.adjusted && <p className="text-xs text-warning">{t.cart.adjusted}</p>}
                </div>
              </li>
            ))}
          </ul>

          <aside aria-labelledby="summary" className="h-fit rounded-lg border border-border bg-surface p-6 lg:sticky lg:top-24">
            <h2 id="summary" className="text-h3">
              Récapitulatif
            </h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">
                  {t.cart.subtotal} ({cart.itemCount} article{cart.itemCount > 1 ? "s" : ""})
                </dt>
                <dd className="tabular">{formatPrice(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t.cart.shipping}</dt>
                <dd className="tabular">{cart.shipping === 0 ? t.cart.free : formatPrice(cart.shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>{t.cart.total}</dt>
                <dd className="font-display tabular">{formatPrice(cart.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted">
              {cart.remainingForFreeShipping > 0
                ? t.cart.freeShippingIn(formatPrice(cart.remainingForFreeShipping))
                : t.cart.freeShippingReached}
            </p>
            {/* Identification demandée seulement maintenant : /commande redirige vers la connexion si besoin. */}
            <ButtonLink href="/commande" size="lg" fullWidth className="mt-6">
              {t.cart.checkout}
              <Icon name="arrowRight" size={18} />
            </ButtonLink>
            <p className="mt-3 text-center text-xs text-muted">
              {user
                ? "Étape suivante : adresse de livraison et paiement."
                : "Vous vous identifierez à l'étape suivante (connexion ou création de compte). Votre panier est conservé."}
            </p>
            <Link href="/" className="mt-4 block text-center text-sm font-medium text-accent underline-offset-4 hover:underline">
              Continuer mes achats
            </Link>
          </aside>
        </div>
      )}
    </Container>
  );
}
