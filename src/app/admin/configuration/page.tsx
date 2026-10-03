import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { AdminPageHeader } from "@/components/admin/ui";
import { getSettingsForEdit, listAdminCategories, listAdminProducts } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Configuration" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin("/admin/configuration");
  const [settings, products, categories] = await Promise.all([getSettingsForEdit(supabase), listAdminProducts(supabase), listAdminCategories(supabase)]);

  return (
    <>
      <AdminPageHeader title="Configuration" subtitle="Coordonnées, livraison, garanties, accueil et FAQ. Enregistrez en brouillon, puis publiez." search={false} />
      <SettingsEditor
        key={settings.draftSavedAt ?? settings.publishedAt ?? "init"}
        initial={settings.data}
        state={settings.state}
        draftSavedAt={settings.draftSavedAt}
        publishedAt={settings.publishedAt}
        products={products.filter((p) => p.state !== "draft-only").map((p) => ({ slug: p.slug, name: p.name, category: p.category }))}
        categories={categories.map((c) => ({ slug: c.slug, name: c.data.name }))}
      />
    </>
  );
}
