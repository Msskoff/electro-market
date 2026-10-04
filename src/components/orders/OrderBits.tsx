import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { Order } from "@/lib/orders/queries";
import { statusTone, type OrderStatus, type StatusTone } from "@/lib/orders/status";

/** Éléments d'affichage d'une commande, partagés par l'espace client et l'administration. */

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-surface-2 text-muted",
  info: "bg-accent-soft text-accent-strong",
  warn: "bg-warning-soft text-warning",
  success: "bg-signal-soft text-signal",
  danger: "bg-danger-soft text-danger",
};

export function StatusBadge({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", toneClasses[statusTone[status]], className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export const orderDate = (iso: string, withTime = true) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Lome",
  }).format(new Date(iso));

/** Articles et montants. */
export function OrderLines({ order }: { order: Order }) {
  return (
    <>
      <ul className="divide-y divide-border text-sm">
        {order.order_items.map((i) => (
          <li key={i.position} className="flex justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block font-medium">{i.name}</span>
              <span className="text-muted">
                {i.variant_label} · {formatPrice(i.unit_price)} × {i.qty}
              </span>
              <span className="block font-mono text-xs text-muted">{i.sku}</span>
            </span>
            <span className="shrink-0 tabular">{formatPrice(i.unit_price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Sous-total</dt>
          <dd className="tabular">{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Livraison</dt>
          <dd className="tabular">{order.shipping === 0 ? "Offerte" : formatPrice(order.shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular">{formatPrice(order.total)}</dd>
        </div>
      </dl>
    </>
  );
}

export function OrderAddress({ order }: { order: Order }) {
  const a = order.address;
  return (
    <address className="text-sm not-italic">
      <span className="block font-semibold">{[order.customer.first_name, order.customer.last_name].filter(Boolean).join(" ") || order.customer.email}</span>
      <span className="block">
        {a.district}, {a.city}
      </span>
      {a.landmark && <span className="block text-muted">{a.landmark}</span>}
      <span className="block tabular">{a.phone}</span>
    </address>
  );
}
