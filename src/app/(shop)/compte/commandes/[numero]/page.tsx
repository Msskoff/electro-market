import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/checkout/CopyButton";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { OrderAddress, OrderLines, orderDate, StatusBadge } from "@/components/orders/OrderBits";
import { ProofForm } from "@/components/orders/ProofForm";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n/fr";
import { getMyOrder } from "@/lib/orders/queries";
import { customerCanCancel, customerStatusLabel, isMobileMoney, paymentMethodShort, trackingSteps } from "@/lib/orders/status";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata = buildMetadata({
  title: "Suivi de commande",
  description: "Paiement, préparation et livraison de votre commande.",
  path: "/compte",
  noindex: true,
});

/** Suivi d'une commande : paiement (numéro + dépôt de la preuve), étapes, détail. Privé. */
export default async function OrderPage({ params, searchParams }: PageProps<"/compte/commandes/[numero]">) {
  const [{ numero }, query] = await Promise.all([params, searchParams]);
  await requireUser(`/compte/commandes/${numero}`);
  const order = await getMyOrder(numero);
  if (!order) notFound();

  const mobile = isMobileMoney(order.payment_method);
  const pay = order.payment_snapshot;
  const steps = trackingSteps(order.payment_method);
  const current = steps.findIndex((s) => s.key.includes(order.status));
  const lastProof = order.payment_proofs[0];

  return (
    <Container className="pb-12">
      <Breadcrumbs
        items={[
          { name: t.nav.account, path: "/compte" },
          { name: "Mes commandes", path: "/compte#commandes" },
          { name: order.number, path: `/compte/commandes/${order.number}` },
        ]}
      />
      {query.nouvelle === "1" && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-lg bg-signal-soft px-4 py-3 font-semibold text-signal">
          <Icon name="check" size={18} className="check-in" />
          Merci ! Votre commande est enregistrée et vos articles sont réservés.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-h1">Commande {order.number}</h1>
        <StatusBadge status={order.status} label={customerStatusLabel[order.status]} />
      </div>
      <p className="mt-1 text-muted">Passée le {orderDate(order.created_at)}</p>

      {order.status !== "cancelled" && (
        <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Avancement de la commande">
          {steps.map((s, i) => (
            <li key={s.label} aria-current={i === current ? "step" : undefined} className="text-xs sm:text-sm">
              <span className={cn("block h-1.5 rounded-full", i <= current ? "bg-accent" : "bg-border")} />
              <span className={cn("mt-2 block font-medium", i <= current ? "text-fg" : "text-muted")}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="min-w-0 space-y-6">
          {order.customer_message && (
            <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-danger">
              <p className="font-semibold">Message de la boutique</p>
              <p className="mt-1">{order.customer_message}</p>
            </div>
          )}

          {mobile && order.status === "awaiting_payment" && (
            <section aria-labelledby="payer" className="rounded-xl border border-accent/40 bg-surface p-4 sm:p-6">
              <h2 id="payer" className="text-h3">
                1. Payez {formatPrice(order.total)} par {pay.label ?? paymentMethodShort[order.payment_method]}
              </h2>
              <div className="mt-4 rounded-lg bg-surface-2 p-4">
                <p className="text-sm text-muted">Numéro à créditer</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="text-h2 font-bold tabular tracking-wide">{pay.number}</span>
                  {pay.number && <CopyButton value={pay.number.replace(/\s/g, "")} label="Copier le numéro" />}
                </div>
                {pay.accountName && (
                  <p className="mt-2 text-sm">
                    Titulaire : <strong>{pay.accountName}</strong>
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <span>
                    Montant exact : <strong className="tabular">{formatPrice(order.total)}</strong>
                  </span>
                  <CopyButton value={String(order.total)} label="Copier le montant" />
                </div>
              </div>
              {pay.instructions && <p className="mt-3 text-sm text-muted">{pay.instructions}</p>}

              <h2 className="mt-8 text-h3">2. Déposez la preuve de paiement</h2>
              <p className="mb-4 mt-1 text-sm text-muted">Nous vérifions votre paiement puis préparons votre commande.</p>
              <ProofForm orderId={order.id} total={order.total} />
            </section>
          )}

          {order.status === "payment_review" && (
            <section className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 sm:p-6">
              <Icon name="clock" size={24} className="shrink-0 text-accent" />
              <div>
                <h2 className="text-h3">Preuve reçue, vérification en cours</h2>
                <p className="mt-1 text-muted">
                  {lastProof
                    ? `Paiement de ${formatPrice(lastProof.amount)} (réf. ${lastProof.reference}) envoyé le ${orderDate(lastProof.created_at)}.`
                    : "Nous vérifions votre paiement."}{" "}
                  Vous serez livré dès la confirmation.
                </p>
              </div>
            </section>
          )}

          <section aria-labelledby="historique" className="rounded-xl border border-border bg-surface p-4 sm:p-6">
            <h2 id="historique" className="text-h3">
              Historique
            </h2>
            <ol className="mt-4 space-y-3 border-l-2 border-border pl-4">
              {order.order_events.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="font-semibold">{customerStatusLabel[e.status as keyof typeof customerStatusLabel] ?? e.status}</span>
                  <span className="text-muted"> · {orderDate(e.created_at)}</span>
                  {e.note && !e.by_admin && <span className="block text-muted">{e.note}</span>}
                </li>
              ))}
            </ol>
          </section>

          {customerCanCancel(order.status, order.payment_method) && <CancelOrderButton orderId={order.id} number={order.number} />}
        </div>

        <aside className="h-fit space-y-6 rounded-xl border border-border bg-surface p-4 sm:p-6">
          <div>
            <h2 className="text-h3">Articles</h2>
            <div className="mt-3">
              <OrderLines order={order} />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Livraison</h2>
            <div className="mt-1">
              <OrderAddress order={order} />
            </div>
            {order.note && <p className="mt-2 text-sm text-muted">« {order.note} »</p>}
          </div>
          <div>
            <h2 className="text-sm font-semibold">Paiement</h2>
            <p className="mt-1 text-sm">{pay.label ?? paymentMethodShort[order.payment_method]}</p>
          </div>
          <Link href="/compte#commandes" className="inline-block text-sm font-medium text-accent underline-offset-4 hover:underline">
            Toutes mes commandes
          </Link>
        </aside>
      </div>
    </Container>
  );
}
