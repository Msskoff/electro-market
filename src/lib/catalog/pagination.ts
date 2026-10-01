import { categoryPath } from "./selectors";

/** Nombre de produits par page de catégorie (multiple de 2, 3 et 4 : grilles pleines). */
export const PAGE_SIZE = 24;

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function paginate<T>(items: T[], page: number): T[] {
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

/** URL d'une page de catégorie : la page 1 est l'URL canonique de la catégorie. */
export function categoryPagePath(slug: string, page: number): string {
  return page <= 1 ? categoryPath(slug) : `${categoryPath(slug)}/page/${page}`;
}
