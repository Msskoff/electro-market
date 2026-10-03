"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/auth/schema";
import { createClient } from "@/lib/supabase/server";
import { MAX_ADDRESSES, addressInputSchema, fieldErrors, profileSchema, uuidSchema } from "./schema";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const NOT_SIGNED_IN: FormState = { message: "Votre session a expiré. Reconnectez-vous." };
const FAILED: FormState = { message: "L'enregistrement a échoué. Réessayez dans un instant." };

/** Client Supabase + identifiant du client connecté (jeton vérifié), ou null. */
async function authed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { firstName: text(formData, "firstName"), lastName: text(formData, "lastName"), phone: text(formData, "phone") };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const ctx = await authed();
  if (!ctx) return NOT_SIGNED_IN;
  const { firstName, lastName, phone } = parsed.data;
  const { error } = await ctx.supabase
    .from("profiles")
    .upsert({ id: ctx.userId, first_name: firstName, last_name: lastName, phone });
  if (error) return { ...FAILED, values };

  revalidatePath("/compte");
  return { ok: true, message: "Informations enregistrées." };
}

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    label: text(formData, "label"),
    district: text(formData, "district"),
    city: text(formData, "city"),
    landmark: text(formData, "landmark"),
    phone: text(formData, "phone"),
  };
  const parsed = addressInputSchema.safeParse({ ...values, isDefault: formData.get("isDefault") === "on" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const ctx = await authed();
  if (!ctx) return NOT_SIGNED_IN;
  const { supabase } = ctx;
  const { label, district, city, landmark, phone, isDefault } = parsed.data;
  const row = { label, district, city, landmark, phone };

  const rawId = formData.get("id");
  let id: string;
  if (rawId) {
    const idParsed = uuidSchema.safeParse(rawId);
    if (!idParsed.success) return FAILED;
    id = idParsed.data;
    const { error } = await supabase.from("addresses").update(row).eq("id", id);
    if (error) return { ...FAILED, values };
  } else {
    const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= MAX_ADDRESSES) return { message: `${MAX_ADDRESSES} adresses maximum.`, values };
    const { data, error } = await supabase.from("addresses").insert(row).select("id").single();
    if (error || !data) return { ...FAILED, values };
    id = data.id;
    // La première adresse devient l'adresse par défaut.
    if ((count ?? 0) === 0) await supabase.rpc("set_default_address", { target: id });
  }
  if (isDefault) await supabase.rpc("set_default_address", { target: id });

  revalidatePath("/compte");
  return { ok: true, message: "Adresse enregistrée." };
}

export async function deleteAddress(id: string): Promise<FormState> {
  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) return FAILED;
  const ctx = await authed();
  if (!ctx) return NOT_SIGNED_IN;
  const { supabase } = ctx;

  const { data: removed, error } = await supabase.from("addresses").delete().eq("id", idParsed.data).select("is_default").maybeSingle();
  if (error) return FAILED;
  // Si l'adresse par défaut est supprimée, la plus ancienne restante prend le relais.
  if (removed?.is_default) {
    const { data: next } = await supabase.from("addresses").select("id").order("created_at").limit(1).maybeSingle();
    if (next) await supabase.rpc("set_default_address", { target: next.id });
  }

  revalidatePath("/compte");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<FormState> {
  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) return FAILED;
  const ctx = await authed();
  if (!ctx) return NOT_SIGNED_IN;
  const { error } = await ctx.supabase.rpc("set_default_address", { target: idParsed.data });
  if (error) return FAILED;
  revalidatePath("/compte");
  return { ok: true };
}
