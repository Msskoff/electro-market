import Link from "next/link";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { orderDate, StatusBadge } from "@/components/orders/OrderBits";
import { requireAdmin } from "@/lib/admin/session";
import { listOrdersForAdmin } from "@/lib/orders/queries";
import { adminStatusLabel, ORDER_STATUSES, paymentMethodShort, type OrderStatus } from "@/lib/orders/status";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Commandes" };

/** Ordre des onglets : ce qui demande une action d'abord. */
const TABS: OrderStatus[] = ["payment_review", "to_ship", "awaiting_payment", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/commandes">) {
  const { supabase } = await requireAdmin("/admin/commandes");
  const sp = await searchParams;
  const statut = typeof sp.statut === "string" && (ORDER_STATUSES as string[]).includes(sp.statut) ? (sp.statut as OrderStatus) : undefined;
  const { orders, counts } = await listOrdersForAdmin(supabase, statut);
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const toDo = (counts.payment_review ?? 0) + (counts.to_ship ?? 0);

  return (
    <>
      <AdminPageHeader
        title="Commandes"
        subtitle={toDo ? `${toDo} commande(s) demandent votre attention : preuves à vérifier et colis à expédier.` : "Aucune action en attente."}
        search={false}
      />

      <nav aria-label="Filtrer par statut" className="no-scrollbar -mx-3 mb-4 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
        {[undefined, ...TABS].map((s) => {
          const active = s === statut;
          const n = s ? (counts[s] ?? 0) : total;
          return (
            <Link
              key={s ?? "toutes"}
              href={s ? `/admin/commandes?statut=${s}` : "/admin/commandes"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active ? "bg-inverse text-on-inverse" : "bg-surface text-muted shadow-sm hover:text-fg",
              )}
            >
              {s ? adminStatusLabel[s] : "Toutes"}
              <span className={cn("rounded-full px-1.5 text-xs tabular", active ? "bg-on-inverse/20" : "bg-surface-2")}>{n}</span>
            </Link>
          );
        })}
      </nav>

      <AdminCard className="p-0 sm:p-0">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-muted">Aucune commande{statut ? ` « ${adminStatusLabel[statut]} »` : ""} pour le moment.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Commandes</caption>
            <thead className="hidden border-b border-border text-xs uppercase tracking-wide text-muted md:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Commande</th>
                <th scope="col" className="px-3 py-3 font-semibold">Client</th>
                <th scope="col" className="px-3 py-3 font-semibold">Paiement</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-5 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="relative grid grid-cols-2 gap-1 p-4 hover:bg-surface-2 md:table-row md:p-0">
                  <td className="md:px-5 md:py-3">
                    <Link href={`/admin/commandes/${o.number}`} className="font-semibold after:absolute after:inset-0 hover:text-accent">
                      {o.number}
                    </Link>
                    <span className="block text-xs text-muted">{orderDate(o.created_at)}</span>
                  </td>
                  <td className="text-right md:px-3 md:py-3 md:text-left">
                    <span className="block font-medium">{[o.customer.first_name, o.customer.last_name].filter(Boolean).join(" ") || o.customer.email}</span>
                    <span className="block text-xs tabular text-muted">{o.customer.phone}</span>
                  </td>
                  <td className="text-muted md:px-3 md:py-3">{paymentMethodShort[o.payment_method]}</td>
                  <td className="text-right font-semibold tabular md:px-3 md:py-3">
                    {formatPrice(o.total)}
                    <span className="block text-xs font-normal text-muted">{o.itemCount} article(s)</span>
                  </td>
                  <td className="col-span-2 md:px-5 md:py-3">
                    <StatusBadge status={o.status} label={adminStatusLabel[o.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminCard>
    </>
  );
}
