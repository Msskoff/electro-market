import { AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { listCustomers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Clients" };

const date = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";

/** Comptes clients (lecture seule). Données personnelles : affichées ici uniquement, jamais exportées. */
export default async function AdminCustomersPage() {
  const { supabase } = await requireAdmin("/admin/clients");
  const customers = await listCustomers(supabase);

  return (
    <>
      <AdminPageHeader title="Clients" subtitle={`${customers.length} compte(s) client. Données personnelles : consultation uniquement.`} search={false} />
      <AdminCard className="p-0 sm:p-0">
        {customers.length === 0 ? (
          <p className="p-8 text-center text-muted">Aucun client inscrit pour le moment.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Comptes clients</caption>
            <thead className="hidden border-b border-border text-xs uppercase tracking-wide text-muted md:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Client</th>
                <th scope="col" className="px-3 py-3 font-semibold">Téléphone</th>
                <th scope="col" className="px-3 py-3 font-semibold">Panier</th>
                <th scope="col" className="px-3 py-3 font-semibold">Inscription</th>
                <th scope="col" className="px-5 py-3 font-semibold">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id} className="grid grid-cols-2 gap-2 p-4 md:table-row md:p-0">
                  <td className="col-span-2 md:px-5 md:py-3">
                    <span className="block font-semibold">{[c.first_name, c.last_name].filter(Boolean).join(" ") || "Nom non renseigné"}</span>
                    <a href={`mailto:${c.email}`} className="text-xs text-accent hover:underline">
                      {c.email}
                    </a>
                  </td>
                  <td className="md:px-3 md:py-3">{c.phone || <span className="text-muted">—</span>}</td>
                  <td className="tabular md:px-3 md:py-3">{c.cartItems ? `${c.cartItems} article(s)` : <span className="text-muted">Vide</span>}</td>
                  <td className="text-muted md:px-3 md:py-3">{date(c.created_at)}</td>
                  <td className="text-muted md:px-5 md:py-3">{date(c.last_sign_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminCard>
    </>
  );
}
