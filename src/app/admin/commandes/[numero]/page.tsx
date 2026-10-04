import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/OrderActions";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { OrderAddress, OrderLines, orderDate, StatusBadge } from "@/components/orders/OrderBits";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/admin/session";
import { getOrderForAdmin } from "@/lib/orders/queries";
import { adminStatusLabel, isMobileMoney } from "@/lib/orders/status";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Commande" };

const proofStatus = { pending: "À vérifier", accepted: "Acceptée", rejected: "Refusée" } as const;

export default async function AdminOrderPage({ params }: PageProps<"/admin/commandes/[numero]">) {
  const { numero } = await params;
  const { supabase } = await requireAdmin(`/admin/commandes/${numero}`);
  const order = await getOrderForAdmin(supabase, numero);
  if (!order) notFound();
  const pay = order.payment_snapshot;
  const phone = order.address.phone.replace(/\s/g, "");

  return (
    <>
      <Link href="/admin/commandes" className="text-sm font-semibold text-muted hover:text-accent">
        ← Commandes
      </Link>
      <AdminPageHeader
        title={`Commande ${order.number}`}
        subtitle={`Passée le ${orderDate(order.created_at)} · ${formatPrice(order.total)} · ${pay.label ?? order.payment_method}`}
        search={false}
        actions={<StatusBadge status={order.status} label={adminStatusLabel[order.status]} className="px-3.5 py-2 text-sm" />}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          {isMobileMoney(order.payment_method) && (
            <AdminCard aria-labelledby="preuves-titre">
              <h2 id="preuves-titre" className="text-h3 font-semibold">
                Preuves de paiement
              </h2>
              <p className="mt-1 text-sm text-muted">
                À comparer avec votre relevé {pay.label} ({pay.number}) : montant attendu <strong className="tabular text-fg">{formatPrice(order.total)}</strong>.
              </p>
              {order.payment_proofs.length === 0 ? (
                <p className="mt-4 rounded-lg bg-surface-2 p-4 text-sm text-muted">Aucune preuve déposée pour le moment.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-4">
                  {order.payment_proofs.map((p) => {
                    const amountOk = p.amount === order.total;
                    const isPdf = p.file_path.endsWith(".pdf");
                    return (
                      <li key={p.id} className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[220px_1fr]">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md bg-surface-2">
                            {isPdf ? (
                              <span className="flex h-40 flex-col items-center justify-center gap-2 text-sm font-semibold text-accent">
                                <Icon name="receipt" size={28} />
                                Ouvrir le PDF
                              </span>
                            ) : (
                              // Fichier privé servi par un lien signé temporaire : pas d'optimisation next/image.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.url} alt={`Preuve de paiement, référence ${p.reference}`} className="max-h-72 w-full object-contain" />
                            )}
                          </a>
                        ) : (
                          <p className="text-sm text-danger">Fichier indisponible.</p>
                        )}
                        <dl className="grid content-start gap-2 text-sm">
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted">Statut</dt>
                            <dd className={cn("font-semibold", p.status === "accepted" ? "text-signal" : p.status === "rejected" ? "text-danger" : "text-warning")}>{proofStatus[p.status]}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted">Référence</dt>
                            <dd className="font-mono">{p.reference}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted">Montant déclaré</dt>
                            <dd className={cn("font-semibold tabular", amountOk ? "text-signal" : "text-danger")}>
                              {formatPrice(p.amount)} {amountOk ? "✓" : `(attendu ${formatPrice(order.total)})`}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted">Payé le</dt>
                            <dd>{orderDate(p.paid_at)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted">Déposée le</dt>
                            <dd>{orderDate(p.created_at)}</dd>
                          </div>
                        </dl>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AdminCard>
          )}

          <AdminCard aria-labelledby="articles-titre">
            <h2 id="articles-titre" className="text-h3 font-semibold">
              Articles
            </h2>
            <div className="mt-3">
              <OrderLines order={order} />
            </div>
          </AdminCard>

          <AdminCard aria-labelledby="historique-titre">
            <h2 id="historique-titre" className="text-h3 font-semibold">
              Historique
            </h2>
            <ol className="mt-4 space-y-3 border-l-2 border-border pl-4">
              {order.order_events.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="font-semibold">{adminStatusLabel[e.status as keyof typeof adminStatusLabel] ?? e.status}</span>
                  <span className="text-muted">
                    {" "}
                    · {orderDate(e.created_at)} · {e.by_admin ? "par vous" : "par le client"}
                  </span>
                  {e.note && <span className="block text-muted">{e.note}</span>}
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        <div className="flex flex-col gap-4">
          <AdminCard aria-labelledby="actions-titre">
            <h2 id="actions-titre" className="text-h3 font-semibold">
              Suivi
            </h2>
            <div className="mt-4">
              <OrderActions orderId={order.id} status={order.status} method={order.payment_method} />
            </div>
          </AdminCard>
          <AdminCard aria-labelledby="client-titre">
            <h2 id="client-titre" className="text-h3 font-semibold">
              Client et livraison
            </h2>
            <div className="mt-3">
              <OrderAddress order={order} />
              <p className="mt-2 text-sm text-muted">{order.customer.email}</p>
              {order.note && <p className="mt-3 rounded-md bg-surface-2 p-3 text-sm">« {order.note} »</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${phone}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-semibold hover:border-fg">
                <Icon name="phone" size={16} />
                Appeler
              </a>
              <a
                href={`https://wa.me/${phone.replace(/^\+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-semibold hover:border-fg"
              >
                <Icon name="chat" size={16} />
                WhatsApp
              </a>
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
