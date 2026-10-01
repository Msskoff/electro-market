import localFont from "next/font/local";

/**
 * Polices auto-hébergées (paquets @fontsource), chargées via next/font :
 * aucune requête vers un service tiers, `font-display: swap`, et police de
 * secours aux métriques ajustées (`adjustFontFallback`) pour éviter tout
 * décalage de mise en page (CLS) au chargement.
 *
 * Budget (connexions mobiles de Lomé) : ~100 Ko préchargés au total.
 *  - Inter (texte, interface)  : 48 Ko, préchargée
 *  - Source Serif 4 (titres)   : 51 Ko, préchargée (le titre du hero est l'élément LCP)
 *  - JetBrains Mono (specs)    : 40 Ko, chargée à la demande
 * Les fichiers « opsz » (taille optique) pèsent 73 Ko et 122 Ko : gain visuel
 * trop faible pour leur coût réseau, on garde les versions « wght ».
 */

export const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: "Arial",
});

/** Serif éditoriale des titres. */
export const sourceSerif = localFont({
  src: "../../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2",
  variable: "--font-source-serif",
  weight: "200 900",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const jetbrainsMono = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
