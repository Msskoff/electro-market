/**
 * Typographie française : espaces insécables là où un retour à la ligne
 * serait fautif (« Quelle garantie ? » ne doit jamais laisser le « ? » seul
 * en début de ligne).
 *  - espace fine insécable (U+202F) avant ? ! ;
 *  - espace insécable (U+00A0) avant : et à l'intérieur des guillemets « »
 * Les deux-points sans espace (heures « 10:30 », URL) ne sont pas touchés.
 */
export function frenchSpacing(text: string): string {
  return text
    .replace(/ ([?!;])/g, " $1")
    .replace(/ :/g, " :")
    .replace(/« /g, "« ")
    .replace(/ »/g, " »");
}
