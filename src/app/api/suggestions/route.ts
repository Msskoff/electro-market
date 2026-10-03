import { getSuggestionIndex } from "@/lib/catalog/repository";

/**
 * Index des suggestions de recherche : généré au build, servi depuis le cache CDN.
 * Le navigateur le charge une seule fois (au premier clic dans la barre de recherche)
 * puis filtre localement : suggestions instantanées, sans requête à chaque frappe.
 */
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await getSuggestionIndex(), {
    // Navigateur : 5 min (prix et catalogue à jour peu après un déploiement) ; CDN : purgé à chaque déploiement.
    headers: { "Cache-Control": "public, max-age=300, s-maxage=86400" },
  });
}
