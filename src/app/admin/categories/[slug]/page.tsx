import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { AdminPageHeader } from "@/components/admin/ui";
import { listAdminCategories } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Modifier une catégorie" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[slug]">) {
  const { slug } = await params;
  const { supabase } = await requireAdmin(`/admin/categories/${slug}`);
  const category = (await listAdminCategories(supabase)).find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <>
      <Link href="/admin/categories" className="text-sm font-semibold text-muted hover:text-accent">
        ← Catégories
      </Link>
      <AdminPageHeader title={category.data.name} search={false} />
      <CategoryEditor
        key={category.draftSavedAt ?? category.publishedAt}
        initial={{ ...category.data, searchKeywords: category.data.searchKeywords ?? "" }}
        state={category.state}
        draftSavedAt={category.draftSavedAt}
        publishedAt={category.publishedAt}
      />
    </>
  );
}
