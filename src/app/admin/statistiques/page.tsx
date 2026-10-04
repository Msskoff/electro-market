import Link from "next/link";
import { BarList, ChartCard, Donut, Empty, FunnelChart, Heatmap, Kpi, num, TrendChart } from "@/components/admin/charts";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { delta, getAnalytics, parsePeriod, pct, PERIODS, type Analytics } from "@/lib/admin/analytics";
import { requireAdmin } from "@/lib/admin/session";
import { paymentMethodShort } from "@/lib/orders/status";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Statistiques" };

const deviceLabel = { mobile: "Téléphone", tablet: "Tablette", desktop: "Ordinateur" } as const;

/** Constats calculés à partir des chiffres : ce qui mérite une décision. */
function insights(a: Analytics): { tone: "good" | "warn" | "info"; text: string }[] {
  const out: { tone: "good" | "warn" | "info"; text: string }[] = [];
  const f = a.funnel;
  const zero = a.searches.filter((s) => s.min_results === 0);
  if (zero.length) out.push({ tone: "warn", text: `${zero.length} recherche(s) sans résultat (ex. « ${zero.slice(0, 3).map((s) => s.query).join(" », « ")} ») : produits demandés que vous ne proposez pas.` });
  if (f.product_viewers >= 20 && pct(f.adders, f.product_viewers) < 5) out.push({ tone: "warn", text: `Seulement ${pct(f.adders, f.product_viewers)} % des visiteurs qui voient une fiche ajoutent au panier : vérifiez prix, photos et disponibilité.` });
  if (f.checkouts >= 5 && pct(f.orders, f.checkouts) < 50) out.push({ tone: "warn", text: `${f.checkouts - f.orders} visiteur(s) sont arrivés à la commande sans la valider : l'étape de paiement ou d'adresse les freine peut-être.` });
  if (a.viewedNotBought.length) out.push({ tone: "info", text: `« ${a.viewedNotBought[0].name} » attire (${a.viewedNotBought[0].views} visiteurs) mais ne se vend pas : à mettre en avant ou à revoir.` });
  const mobile = a.devices.find((d) => d.device === "mobile")?.visitors ?? 0;
  const allDev = a.devices.reduce((s, d) => s + d.visitors, 0);
  if (allDev >= 10) out.push({ tone: "info", text: `${pct(mobile, allDev)} % des visites viennent d'un téléphone.` });
  if (a.sources[0] && a.sources[0].source !== "Direct") out.push({ tone: "good", text: `Votre première source de visiteurs : ${a.sources[0].source} (${a.sources[0].visitors}).` });
  const d = delta(a.totals.revenue, a.totals.prev_revenue);
  if (d !== null && d > 0) out.push({ tone: "good", text: `Chiffre d'affaires en hausse de ${d} % par rapport à la période précédente.` });
  return out;
}

export default async function StatsPage({ searchParams }: PageProps<"/admin/statistiques">) {
  const { supabase } = await requireAdmin("/admin/statistiques");
  const days = parsePeriod((await searchParams).periode);
  const a = await getAnalytics(supabase, days);
  const t = a.totals;
  const f = a.funnel;
  const conv = pct(t.orders, t.visitors);
  const prevConv = pct(t.prev_orders, t.prev_visitors);
  const basket = t.orders ? Math.round(t.revenue / t.orders) : 0;
  const prevBasket = t.prev_orders ? Math.round(t.prev_revenue / t.prev_orders) : 0;
  const notes = insights(a);
  const empty = t.pageviews === 0 && t.orders === 0;

  return (
    <>
      <AdminPageHeader
        title="Statistiques"
        subtitle={`Audience anonyme et ventes sur ${days} jours, comparées aux ${days} jours précédents.`}
        search={false}
        actions={
          <nav aria-label="Période" className="flex gap-1 rounded-full bg-surface p-1 shadow-sm">
            {PERIODS.map((p) => (
              <Link
                key={p.value}
                href={`/admin/statistiques?periode=${p.value}`}
                aria-current={p.value === days ? "page" : undefined}
                className={cn("rounded-full px-4 py-2 text-sm font-semibold", p.value === days ? "bg-inverse text-on-inverse" : "text-muted hover:text-fg")}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        }
      />

      {empty && (
        <AdminCard className="mb-4 flex items-start gap-3">
          <Icon name="clock" size={22} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm text-muted">
            La mesure d&apos;audience vient d&apos;être mise en service : les graphiques se rempliront avec les prochaines visites. Aucun cookie n&apos;est utilisé et aucun visiteur n&apos;est identifiable.
          </p>
        </AdminCard>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Visiteurs" value={num(t.visitors)} delta={delta(t.visitors, t.prev_visitors)} />
        <Kpi label="Pages vues" value={num(t.pageviews)} delta={delta(t.pageviews, t.prev_pageviews)} hint={t.visitors ? `${(t.pageviews / t.visitors).toFixed(1)} par visite` : undefined} />
        <Kpi label="Commandes" value={num(t.orders)} delta={delta(t.orders, t.prev_orders)} />
        <Kpi label="Chiffre d'affaires" value={t.revenue} money delta={delta(t.revenue, t.prev_revenue)} hint="hors annulées" />
        <Kpi label="Taux de conversion" value={`${conv} %`} delta={prevConv ? Math.round(((conv - prevConv) / prevConv) * 100) : null} hint="commandes / visiteurs" />
        <Kpi label="Panier moyen" value={basket || "—"} money={basket > 0} delta={basket ? delta(basket, prevBasket) : undefined} />
      </div>

      {notes.length > 0 && (
        <AdminCard className="mt-4" aria-labelledby="constats">
          <h2 id="constats" className="text-h3 font-semibold">
            À retenir
          </h2>
          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {notes.map((n) => (
              <li key={n.text} className={cn("flex items-start gap-2 rounded-lg p-3 text-sm", n.tone === "warn" ? "bg-warning-soft" : n.tone === "good" ? "bg-signal-soft" : "bg-surface-2")}>
                <Icon name={n.tone === "warn" ? "alert" : n.tone === "good" ? "check" : "sparkle"} size={18} className={cn("mt-0.5 shrink-0", n.tone === "warn" ? "text-warning" : n.tone === "good" ? "text-signal" : "text-accent")} />
                {n.text}
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <ChartCard id="tendance" title="Visiteurs et commandes" description="Par jour. Survolez un point pour le détail." className="xl:col-span-3">
          <TrendChart data={a.daily} />
        </ChartCard>
        <ChartCard id="entonnoir" title="Entonnoir d'achat" description="Combien de visiteurs franchissent chaque étape." className="xl:col-span-2">
          <FunnelChart
            steps={[
              { label: "Visiteurs", value: f.visitors },
              { label: "Ont vu un produit", value: f.product_viewers },
              { label: "Ont ajouté au panier", value: f.adders },
              { label: "Sont allés à la commande", value: f.checkouts },
              { label: "Ont commandé", value: f.orders },
              { label: "Paiement confirmé", value: f.paid, hint: "Mobile money vérifié ou paiement à la livraison" },
            ]}
          />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard id="vus" title="Produits les plus consultés" description="Visiteurs uniques · ajouts au panier · ventes">
          {a.topViewed.length ? (
            <BarList
              items={a.topViewed.map((p) => ({
                label: p.name,
                href: `/admin/produits/${p.id}`,
                value: p.views,
                note: `${p.adds} ajout(s) · ${p.sold} vendu(s)`,
              }))}
            />
          ) : (
            <Empty>Pas encore de fiche consultée sur la période.</Empty>
          )}
        </ChartCard>
        <ChartCard id="vendus" title="Meilleures ventes" description="Chiffre d'affaires par produit (hors annulées)">
          {a.topSold.length ? (
            <BarList tone="signal" format={formatPrice} items={a.topSold.map((p) => ({ label: p.name, href: `/admin/produits/${p.id}`, value: p.revenue, note: `${p.sold} unité(s)` }))} />
          ) : (
            <Empty>Aucune vente sur la période.</Empty>
          )}
        </ChartCard>
        <ChartCard id="interet" title="Intérêt sans achat" description="Vus par 3 visiteurs ou plus, jamais achetés : prix, photos ou stock à revoir.">
          {a.viewedNotBought.length ? (
            <BarList tone="warning" items={a.viewedNotBought.map((p) => ({ label: p.name, href: `/admin/produits/${p.id}`, value: p.views, note: `${pct(p.adds, p.views)} % ajoutent au panier` }))} />
          ) : (
            <Empty>Rien à signaler.</Empty>
          )}
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard id="sources" title="D'où viennent les visiteurs" description="Site ou lien d'arrivée (Google, WhatsApp, Facebook…).">
          {a.sources.length ? <BarList tone="inverse" items={a.sources.map((s) => ({ label: s.source, value: s.visitors }))} /> : <Empty>Pas encore de visite.</Empty>}
          <p className="mt-3 text-xs text-muted">
            Astuce : ajoutez <code className="rounded bg-surface-2 px-1">?utm_source=whatsapp</code> à vos liens partagés pour les reconnaître.
          </p>
        </ChartCard>
        <ChartCard id="appareils" title="Appareils">
          {a.devices.length ? <Donut items={a.devices.map((d) => ({ label: deviceLabel[d.device] ?? d.device, value: d.visitors }))} center={num(a.devices.reduce((s, d) => s + d.visitors, 0))} /> : <Empty>Pas encore de visite.</Empty>}
        </ChartCard>
        <ChartCard id="paiements" title="Moyens de paiement" description="Commandes de la période (hors annulées)">
          {a.methods.length ? <Donut items={a.methods.map((m) => ({ label: paymentMethodShort[m.method] ?? m.method, value: m.orders }))} center={num(t.orders)} /> : <Empty>Aucune commande sur la période.</Empty>}
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard id="recherches" title="Ce que cherchent les visiteurs" description="Recherches tapées sur le site. En rouge : aucun résultat.">
          {a.searches.length ? (
            <BarList
              items={a.searches.map((s) => ({
                label: <span className={s.min_results === 0 ? "text-danger" : undefined}>{s.query}</span>,
                value: s.count,
                note: s.min_results === 0 ? "aucun résultat" : undefined,
                href: `/recherche?q=${encodeURIComponent(s.query)}`,
              }))}
            />
          ) : (
            <Empty>Aucune recherche sur la période.</Empty>
          )}
        </ChartCard>
        <ChartCard id="pages" title="Pages les plus vues">
          {a.pages.length ? <BarList tone="inverse" items={a.pages.map((p) => ({ label: p.path, value: p.views, note: `${p.visitors} visiteur(s)`, href: p.path }))} /> : <Empty>Pas encore de visite.</Empty>}
        </ChartCard>
      </div>

      <ChartCard id="affluence" title="Heures d'affluence" description="Pages vues par jour et par heure (heure de Lomé) : le bon moment pour publier une offre ou répondre vite." className="mt-4">
        <Heatmap cells={a.hours} />
      </ChartCard>

      <p className="mt-6 text-xs text-muted">
        Mesure anonyme et sans cookie : un visiteur est compté une fois par jour, sans adresse IP ni compte enregistrés. Les robots et les pages d&apos;administration ne sont pas comptés.
      </p>
    </>
  );
}
