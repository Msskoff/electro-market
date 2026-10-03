import localFont from "next/font/local";

/**
 * Polices auto-hébergées (paquets @fontsource), chargées via next/font :
 * aucune requête vers un service tiers, `font-display: swap`, et police de
 * secours aux métriques ajustées (`adjustFontFallback`) pour éviter tout
 * décalage de mise en page (CLS) au chargement.
 *
 * Poppins (non variable) : uniquement les 4 graisses utilisées, jeu « latin »
 * (couvre le français : accents, « œ », « », espaces fines insécables, …).
 *   400 Regular  : texte courant
 *   500 Medium   : libellés, navigation, champs
 *   600 SemiBold : titres, boutons
 *   700 Bold     : prix, grands titres
 * ≈ 31 Ko au total, préchargés (titre du hero = élément LCP).
 */
export const poppins = localFont({
  src: [
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: "Arial",
});

/** Codes et références (SKU, micro-étiquettes de caractéristiques) : chargée à la demande. */
export const jetbrainsMono = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
