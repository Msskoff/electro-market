import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Address, Profile } from "./schema";

/** Profil et adresses du client connecté (la RLS garantit qu'il ne voit que les siens). */
export async function getAccount(userId: string): Promise<{ profile: Profile; addresses: Address[] }> {
  const supabase = await createClient();
  const [{ data: profileRow }, { data: addressRows }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, phone").eq("id", userId).maybeSingle(),
    supabase
      .from("addresses")
      .select("id, label, district, city, landmark, phone, is_default")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  return {
    profile: {
      firstName: profileRow?.first_name ?? "",
      lastName: profileRow?.last_name ?? "",
      phone: profileRow?.phone ?? null,
    },
    addresses: (addressRows ?? []).map((a) => ({
      id: a.id,
      label: a.label,
      district: a.district,
      city: a.city,
      landmark: a.landmark,
      phone: a.phone,
      isDefault: a.is_default,
    })),
  };
}
