import Link from "next/link";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { emptyProduct } from "@/lib/admin/product-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { listAdminBrands, listAdminCategories } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin("/admin/produits/nouveau");
  const [categories, brands] = await Promise.all([listAdminCategories(supabase), listAdminBrands(supabase)]);
  const cats = categories.map((c) => c.data);
  return (
    <>
      <Link href="/admin/produits" className="text-sm font-semibold text-muted hover:text-accent">
        ← Produits
      </Link>
      <AdminPageHeader title="Nouveau produit" subtitle="Enregistrez un brouillon à tout moment ; publiez quand la fiche est complète." search={false} />
      <ProductEditor
        initial={emptyProduct(cats[0], brands[0])}
        isNew
        state="draft-only"
        draftSavedAt={null}
        publishedAt={null}
        publicPath={null}
        inStock
        brands={brands}
        categories={cats}
      />
    </>
  );
}
