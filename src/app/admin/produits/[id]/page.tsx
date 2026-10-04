import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { toEditable } from "@/lib/admin/product-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { getProductForEdit, listAdminBrands, listAdminCategories } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Modifier un produit" };

export default async function EditProductPage({ params }: PageProps<"/admin/produits/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin(`/admin/produits/${id}`);
  const [product, categories, brands] = await Promise.all([getProductForEdit(supabase, id), listAdminCategories(supabase), listAdminBrands(supabase)]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/produits" className="text-sm font-semibold text-muted hover:text-accent">
        ← Produits
      </Link>
      <AdminPageHeader title={product.data.name || "Produit sans nom"} subtitle={`Identifiant ${id}`} search={false} />
      {/* key : une nouvelle version (après publication ou abandon) recharge l'éditeur. */}
      <ProductEditor
        key={`${id}-${product.draftSavedAt ?? product.publishedAt}`}
        initial={toEditable(product.data, product.stockBase)}
        isNew={false}
        state={product.state}
        draftSavedAt={product.draftSavedAt}
        publishedAt={product.publishedAt}
        publicPath={product.publicPath}
        inStock={product.inStock}
        brands={brands}
        categories={categories.map((c) => c.data)}
      />
    </>
  );
}
