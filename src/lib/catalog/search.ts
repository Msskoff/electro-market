/**
 * Recherche textuelle, partagée entre le serveur (page /recherche) et le navigateur
 * (suggestions instantanées) : mêmes règles, mêmes résultats.
 * Insensible à la casse et aux accents ; tous les mots saisis doivent apparaître.
 */

/** Minuscules, sans accents, espaces simples. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Comme normalize(), mais caractère par caractère : même longueur que le texte d'origine. */
function fold(text: string): string {
  return Array.from(text, (c) => {
    const f = c.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    return f.length === 1 ? f : c.toLowerCase().slice(0, 1) || " ";
  }).join("");
}

export function queryTerms(query: string): string[] {
  return normalize(query).split(" ").filter(Boolean);
}

/**
 * Pertinence d'un élément (0 = ne correspond pas).
 * Priorité : nom qui commence par la saisie > mot du nom qui commence par un terme >
 * terme présent dans le nom > terme présent ailleurs (marque, catégorie, points clés).
 */
export function relevance(name: string, haystack: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  if (!terms.every((t) => haystack.includes(t))) return 0;
  const words = name.split(" ");
  let score = 1;
  if (name.startsWith(terms.join(" "))) score += 50;
  for (const t of terms) {
    if (words.some((w) => w.startsWith(t))) score += 10;
    else if (name.includes(t)) score += 4;
  }
  return score;
}

/** Découpe un libellé pour surligner les termes trouvés (pour l'affichage). */
export function highlightParts(label: string, terms: string[]): { text: string; match: boolean }[] {
  if (terms.length === 0) return [{ text: label, match: false }];
  const normalized = fold(label);
  if (normalized.length !== label.length) return [{ text: label, match: false }];
  const marks = new Array<boolean>(label.length).fill(false);
  for (const t of terms) {
    let from = 0;
    for (let i = normalized.indexOf(t, from); i !== -1; i = normalized.indexOf(t, from)) {
      for (let k = i; k < i + t.length; k++) marks[k] = true;
      from = i + t.length;
    }
  }
  const parts: { text: string; match: boolean }[] = [];
  for (let i = 0; i < label.length; i++) {
    const last = parts.at(-1);
    if (last && last.match === marks[i]) last.text += label[i];
    else parts.push({ text: label[i], match: marks[i] });
  }
  return parts;
}
