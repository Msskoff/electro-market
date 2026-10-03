import Link from "next/link";
import { StockToggle } from "@/components/admin/StockToggle";
import { AdminCard, AdminPageHeader, PublishStateBadge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { listAdminCategories, listAdminProducts } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import { normalize } from "@/lib/catalog/search";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Produits" };

const PAGE_SIZE = 40;
const filters = [
  { value: "", label: "Tous" },
  { value: "brouillon", label: "Brouillons" },
  { value: "rupture", label: "En rupture" },
  { value: "faible", label: "Stock faible" },
] as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/produits">) {
  const { supabase } = await requireAdmin("/admin/produits");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const statut = typeof sp.statut === "string" ? sp.statut : "";
  const categorie = typeof sp.categorie === "string" ? sp.categorie : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const [all, categories] = await Promise.all([listAdminProducts(supabase), listAdminCategories(supabase)]);
  const terms = normalize(q).split(" ").filter(Boolean);
  const rows = all.filter((p) => {
    if (categorie && p.category !== categorie) return false;
    if (statut === "brouillon" && p.state === "published") return false;
    if (statut === "rupture" && !(p.state !== "draft-only" && (!p.inStock || p.totalStock === 0))) return false;
    if (statut === "faible" && !(p.inStock && p.lowStock)) return false;
    const hay = normalize(`${p.name} ${p.brand} ${p.slug} ${p.id}`);
    return terms.every((t) => hay.includes(t));
  });
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.data.name ?? slug;
  const href = (patch: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statut) params.set("statut", statut);
    if (categorie) params.set("categorie", categorie);
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === 1) params.delete(k);
      else params.set(k, String(v));
    }
    const s = params.toString();
    return `/admin/produits${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Produits"
        subtitle={`${all.length} produits · ${rows.length} affiché(s)`}
        defaultQuery={q}
        actions={
          <Link href="/admin/produits/nouveau" className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-strong">
            <Icon name="plus" size={18} />
            Ajouter un produit
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={href({ statut: f.value, page: 1 })}
            aria-current={statut === f.value ? "true" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              statut === f.value ? "bg-inverse text-on-inverse" : "bg-surface text-muted shadow-sm hover:text-fg",
            )}
          >
            {f.label}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px bg-border-strong" aria-hidden />
        {[{ slug: "", name: "Toutes catégories" }, ...categories.map((c) => ({ slug: c.slug, name: c.data.name }))].map((c) => (
          <Link
            key={c.slug}
            href={href({ categorie: c.slug, page: 1 })}
            aria-current={categorie === c.slug ? "true" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              categorie === c.slug ? "bg-accent-soft text-accent" : "bg-surface text-muted shadow-sm hover:text-fg",
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <AdminCard className="p-0 sm:p-0">
        {visible.length === 0 ? (
          <p className="p-8 text-center text-muted">Aucun produit ne correspond.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Liste des produits</caption>
            <thead className="hidden border-b border-border text-xs uppercase tracking-wide text-muted md:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Produit</th>
                <th scope="col" className="px-3 py-3 font-semibold">Prix</th>
                <th scope="col" className="px-3 py-3 font-semibold">Stock</th>
                <th scope="col" className="px-3 py-3 font-semibold">État</th>
                <th scope="col" className="px-3 py-3 font-semibold">Disponibilité</th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((p) => (
                <tr key={p.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 p-4 md:table-row md:p-0">
                  <td className="md:px-5 md:py-3">
                    <Link href={`/admin/produits/${p.id}`} className="font-semibold hover:text-accent">
                      {p.name}
                    </Link>
                    <span className="block text-xs text-muted">
                      {catName(p.category)} · {p.variantCount} variante(s)
                    </span>
                  </td>
                  <td className="text-right tabular md:px-3 md:py-3 md:text-left">{formatPrice(p.minPrice)}</td>
                  <td className="tabular md:px-3 md:py-3">
                    <span className={cn(p.lowStock && "font-semibold text-warning", p.totalStock === 0 && "font-semibold text-danger")}>{p.totalStock}</span>
                    <span className="text-muted md:hidden"> en stock</span>
                  </td>
                  <td className="text-right md:px-3 md:py-3 md:text-left">
                    <PublishStateBadge state={p.state} />
                  </td>
                  <td className="md:px-3 md:py-3">
                    {p.state === "draft-only" ? (
                      <span className="text-xs text-muted">Après publication</span>
                    ) : (
                      <StockToggle id={p.id} initial={p.inStock} label={p.name} />
                    )}
                  </td>
                  <td className="text-right md:px-5 md:py-3">
                    <Link href={`/admin/produits/${p.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-accent hover:bg-accent-soft">
                      <Icon name="edit" size={16} />
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminCard>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: n })}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular",
                n === page ? "bg-inverse text-on-inverse" : "bg-surface shadow-sm hover:text-accent",
              )}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
