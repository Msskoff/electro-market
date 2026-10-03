import Link from "next/link";
import { AdminCard, AdminPageHeader, PublishStateBadge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { listAdminCategories, listAdminProducts } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Catégories" };

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin("/admin/categories");
  const [categories, products] = await Promise.all([listAdminCategories(supabase), listAdminProducts(supabase)]);

  return (
    <>
      <AdminPageHeader title="Catégories" subtitle="Textes, introduction et questions fréquentes de chaque rayon." search={false} />
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((c) => (
          <AdminCard key={c.slug} as="article">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-h3 font-semibold">{c.data.name}</h2>
                <p className="text-sm text-muted">{c.data.tagline}</p>
              </div>
              <PublishStateBadge state={c.state} />
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-muted">{c.data.intro}</p>
            <p className="mt-3 text-sm">
              <strong className="tabular">{products.filter((p) => p.category === c.slug).length}</strong> produits · {c.data.faq.length} question(s)
            </p>
            <Link href={`/admin/categories/${c.slug}`} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-inverse px-5 text-sm font-semibold text-on-inverse hover:opacity-90">
              <Icon name="edit" size={16} />
              Modifier
            </Link>
          </AdminCard>
        ))}
      </div>
    </>
  );
}
