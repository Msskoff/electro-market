import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * Un nouveau client par requête : jamais de client partagé entre utilisateurs.
 * Clé « publishable » uniquement : les droits sont limités par la RLS de la base.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Appelé depuis un Server Component : sans effet, le proxy rafraîchit la session.
          }
        },
      },
    },
  );
}
