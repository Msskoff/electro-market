import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog/repository";
import { SETTINGS_TAG } from "@/lib/settings/repository";

/**
 * Après une publication : le site public relit la base à la visite suivante.
 *  - updateTag : vide immédiatement le cache des données (catalogue, configuration) ;
 *  - revalidatePath : régénère les pages statiques, l'index de recherche, le plan du
 *    site et /llms.txt (pages « force-static »).
 */
export function refreshPublicSite(scope: "catalog" | "settings" | "all" = "all") {
  if (scope !== "settings") updateTag(CATALOG_TAG);
  if (scope !== "catalog") updateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/api/suggestions");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
}
