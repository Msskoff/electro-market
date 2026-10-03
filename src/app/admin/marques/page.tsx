import { BrandManager } from "@/components/admin/BrandManager";
import { AdminPageHeader } from "@/components/admin/ui";
import { listAdminBrands } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Marques" };

export default async function AdminBrandsPage() {
  const { supabase } = await requireAdmin("/admin/marques");
  const brands = await listAdminBrands(supabase);
  return (
    <>
      <AdminPageHeader title="Marques" subtitle="Les changements de marque sont mis en ligne immédiatement. Une marque utilisée par des produits ne peut pas être supprimée." search={false} />
      <BrandManager brands={brands} />
    </>
  );
}
