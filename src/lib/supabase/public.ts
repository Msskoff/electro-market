import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client Supabase « anonyme » pour lire le contenu PUBLIC (catalogue, configuration)
 * pendant la génération des pages statiques : aucun cookie, aucune session, donc les
 * pages restent statiques et identiques pour tous. La RLS n'autorise que la lecture.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}
