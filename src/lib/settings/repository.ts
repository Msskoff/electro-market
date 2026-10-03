import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_SETTINGS, type StoreSettings } from "./types";

/**
 * Configuration PUBLIÉE de la boutique (table site_settings), mise en cache par Next.js
 * (étiquette SETTINGS_TAG) et invalidée à chaque publication depuis /admin/configuration.
 * Les clés absentes en base reprennent les valeurs par défaut (ajout de champ sans migration).
 */
export const SETTINGS_TAG = "settings";

export function withDefaults(data: Partial<StoreSettings> | null | undefined): StoreSettings {
  const d = data ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...d,
    contact: { ...DEFAULT_SETTINGS.contact, ...d.contact, address: { ...DEFAULT_SETTINGS.contact.address, ...d.contact?.address } },
    policies: {
      ...DEFAULT_SETTINGS.policies,
      ...d.policies,
      shippingDays: { ...DEFAULT_SETTINGS.policies.shippingDays, ...d.policies?.shippingDays },
    },
  };
}

export const getSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    const { data, error } = await createPublicClient().from("site_settings").select("data").eq("id", "main").maybeSingle();
    if (error) throw new Error(`Lecture de la configuration impossible : ${error.message}`);
    return withDefaults(data?.data as Partial<StoreSettings> | undefined);
  },
  ["settings-v1"],
  { tags: [SETTINGS_TAG] },
);
