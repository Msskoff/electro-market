/**
 * Teinte associée à chaque catégorie, selon son rang dans le catalogue.
 * Partagée par les pastilles de l'accueil et l'en-tête des pages catégorie :
 * une catégorie garde la même couleur partout (repère visuel).
 */
const TILES = ["bg-tile-sky", "bg-tile-sand", "bg-tile-rose", "bg-tile-lilac", "bg-tile-peach"] as const;

export function categoryTile(index: number): (typeof TILES)[number] {
  return TILES[((index % TILES.length) + TILES.length) % TILES.length];
}
