import Link from "next/link";
import { StockToggle } from "@/components/admin/StockToggle";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/ui/Icon";
import { orderDate, StatusBadge } from "@/components/orders/OrderBits";
import { getDashboard } from "@/lib/admin/queries";
import { getSalesOverview } from "@/lib/orders/queries";
import { adminStatusLabel } from "@/lib/orders/status";
import { requireAdmin } from "@/lib/admin/session";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Tableau de bord" };

const entityLabel: Record<string, string> = { product: "Produit", category: "Catégorie", settings: "Configuration" };
const entityHref = (entity: string, key: string) =>
  entity === "product" ? `/admin/produits/${key}` : entity === "category" ? `/admin/categories/${key}` : "/admin/configuration";

const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function Stat({ icon, label, value, hint, href, tone = "neutral" }: { icon: IconName; label: string; value: string; hint: string; href: string; tone?: "neutral" | "warn" | "danger" }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-xl bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          tone === "danger" ? "bg-danger-soft text-danger" : tone === "warn" ? "bg-warning-soft text-warning" : "bg-accent-soft text-accent",
        )}
      >
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-muted">{label}</span>
        <span className="block text-h2 font-bold tabular leading-tight">{value}</span>
        <span className="block truncate text-xs text-muted">{hint}</span>
      </span>
    </Link>
  );
}

export default async function AdminDashboard() {
  const { supabase, firstName } = await requireAdmin();
  const [d, sales] = await Promise.all([getDashboard(supabase), getSalesOverview(supabase)]);

  // Répartition des produits en ligne par gamme de prix (données réelles).
  const buckets = [
    { label: "< 100 k", max: 100_000 },
    { label: "100–250 k", max: 250_000 },
    { label: "250–500 k", max: 500_000 },
    { label: "500 k–1 M", max: 1_000_000 },
    { label: "> 1 M", max: Infinity },
  ].map((b, i, all) => ({
    ...b,
    count: d.online.filter((p) => p.minPrice < b.max && p.minPrice >= (i === 0 ? 0 : all[i - 1].max)).length,
  }));
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const stockValue = d.online.reduce((s, p) => s + p.minPrice * (p.inStock ? p.totalStock : 0), 0);
  const attention = [...d.outOfStock, ...d.lowStock.filter((p) => !d.outOfStock.includes(p))].slice(0, 8);

  return (
    <>
      <AdminPageHeader
        title={`Bonjour${firstName ? `, ${firstName}` : ""} !`}
        subtitle="Voici l'état de votre boutique. Toutes les données sont réelles et à jour."
        actions={
          <Link href="/admin/produits/nouveau" className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-strong">
            <Icon name="plus" size={18} />
            Ajouter un produit
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="package" label="Produits en ligne" value={String(d.online.length)} hint={`${d.products.length - d.online.length} brouillon(s) jamais publié(s)`} href="/admin/produits" />
        <Stat icon="alert" label="En rupture" value={String(d.outOfStock.length)} hint="Produits indisponibles à l'achat" href="/admin/produits?statut=rupture" tone={d.outOfStock.length ? "danger" : "neutral"} />
        <Stat icon="clock" label="Stock faible" value={String(d.lowStock.length)} hint="Une variante à 5 unités ou moins" href="/admin/produits?statut=faible" tone={d.lowStock.length ? "warn" : "neutral"} />
        <Link href="/admin/clients" className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-hero-from via-hero-via to-hero-to p-5 text-on-inverse shadow-sm transition-shadow hover:shadow-md">
          <span className="text-sm text-on-inverse/85">Paniers en cours</span>
          <span className="text-h2 font-bold tabular">{d.activeCarts}</span>
          <span className="text-xs text-on-inverse/85">
            {d.cartItems} article(s) · {d.customerCount} client(s) inscrit(s)
          </span>
        </Link>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <AdminCard className="xl:col-span-2" aria-labelledby="gamme-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="gamme-title" className="text-h3 font-semibold">
              Catalogue par gamme de prix
            </h2>
            <p className="text-sm text-muted">
              Valeur du stock disponible : <strong className="tabular text-fg">{formatPrice(stockValue)}</strong>
            </p>
          </div>
          <ul className="mt-6 flex h-48 items-end gap-3 sm:gap-6" aria-label="Nombre de produits en ligne par gamme de prix">
            {buckets.map((b) => (
              <li key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-sm font-semibold tabular">{b.count}</span>
                <span className="w-full max-w-16 rounded-t-md bg-accent/85" style={{ height: `${Math.max(4, (b.count / maxCount) * 100)}%` }} aria-hidden />
                <span className="whitespace-nowrap text-xs text-muted">{b.label}</span>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard aria-labelledby="drafts-title">
          <h2 id="drafts-title" className="text-h3 font-semibold">
            Brouillons en attente
          </h2>
          <p className="mt-1 text-sm text-muted">Enregistrés mais pas encore publiés : le public ne les voit pas.</p>
          {d.drafts.length === 0 ? (
            <p className="mt-6 rounded-lg bg-surface-2 p-4 text-sm text-muted">Aucun brouillon. Tout ce qui est enregistré est en ligne.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {d.drafts.slice(0, 6).map((draft) => (
                <li key={`${draft.entity}-${draft.key}`}>
                  <Link href={entityHref(draft.entity, draft.key)} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{(draft.name as string) || entityLabel[draft.entity]}</span>
                      <span className="text-xs text-muted">
                        {entityLabel[draft.entity]} · {dateTime(draft.updated_at)}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={18} className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <AdminCard className="xl:col-span-2" aria-labelledby="stock-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="stock-title" className="text-h3 font-semibold">
              À surveiller : ruptures et stocks faibles
            </h2>
            <Link href="/admin/produits?statut=rupture" className="text-sm font-semibold text-accent hover:underline">
              Tout voir
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="mt-4 rounded-lg bg-signal-soft p-4 text-sm text-signal">Tous les produits en ligne sont disponibles.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {attention.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link href={`/admin/produits/${p.id}`} className="min-w-0 hover:text-accent">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-muted">
                      {p.totalStock} unité(s) · dès {formatPrice(p.minPrice)}
                    </span>
                  </Link>
                  <StockToggle id={p.id} initial={p.inStock} label={p.name} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <div className="grid gap-4">
          <AdminCard aria-labelledby="ventes-title">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="ventes-title" className="text-h3 font-semibold">
                Ventes (30 jours)
              </h2>
              <Link href="/admin/statistiques" className="text-sm font-semibold text-accent hover:underline">
                Statistiques
              </Link>
            </div>
            <p className="mt-2 text-h2 font-bold tabular">{formatPrice(sales.revenue30)}</p>
            <p className="text-sm text-muted">{sales.orders30} commande(s), hors annulées</p>
            <h3 className="mt-5 text-sm font-semibold">À traiter</h3>
            {sales.toProcess.length === 0 ? (
              <p className="mt-2 rounded-lg bg-signal-soft p-3 text-sm text-signal">Aucune commande en attente.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {sales.toProcess.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/commandes/${o.number}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:text-accent">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {o.number} · {formatPrice(o.total)}
                        </span>
                        <span className="text-xs text-muted">{orderDate(o.created_at)}</span>
                      </span>
                      <StatusBadge status={o.status} label={adminStatusLabel[o.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
          <AdminCard className="flex flex-col items-center text-center" aria-labelledby="secu-title">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon name="shield" size={28} />
            </span>
            <h2 id="secu-title" className="mt-3 text-h3 font-semibold">
              Protégez votre compte
            </h2>
            <p className="mt-1 text-sm text-muted">Ce compte peut tout modifier : utilisez un mot de passe long et unique.</p>
            <Link href="/compte#securite" className="mt-4 inline-flex h-11 items-center rounded-full bg-inverse px-5 text-sm font-semibold text-on-inverse hover:opacity-90">
              Changer mon mot de passe
            </Link>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
