/**
 * Diapositives du hero de l'accueil : deux par catégorie, chacune liée à un produit réel du catalogue.
 *
 * Règle : chaque affirmation doit correspondre à la fiche du produit (aucune promesse inventée).
 *
 * Vidéos : déposez les fichiers dans `public/videos/` puis renseignez `video`, par exemple
 *   video: { mp4: "/videos/aurion-one.mp4", webm: "/videos/aurion-one.webm", poster: "/videos/aurion-one.jpg" }
 * Format conseillé : 1920 × 1080 (paysage), 8–12 s en boucle, sans son, < 3 Mo, sujet cadré à droite.
 * Sans vidéo, une scène animée vectorielle est affichée à la place.
 */
export interface HeroVideo {
  mp4?: string;
  webm?: string;
  poster?: string;
}

export interface HeroSlide {
  categorySlug: string;
  productSlug: string;
  /** Teinte d'ambiance de la scène (token de tuile). */
  tone: "peach" | "sand" | "sky" | "rose" | "lilac";
  title: string;
  text: string;
  video?: HeroVideo;
}

export const heroSlides: HeroSlide[] = [
  {
    categorySlug: "smartphones",
    productSlug: "aurion-one-5g",
    tone: "sky",
    title: "Lisible, même en plein soleil.",
    text: "Écran OLED 120 Hz de 2 000 nits, capteur 50 Mpx stabilisé et 5 ans de mises à jour annoncées. Le haut de gamme, en format compact.",
  },
  {
    categorySlug: "ordinateurs-portables",
    productSlug: "nuvia-book-14-air",
    tone: "sand",
    title: "1,2 kg. Jusqu'à 15 heures.",
    text: "Un ultraportable 14 pouces 2,8K en aluminium de 14 mm, pensé pour les étudiants et les professionnels nomades.",
  },
  {
    categorySlug: "smartphones",
    productSlug: "kelvo-neo-6a",
    tone: "peach",
    title: "La 5G, sans se ruiner.",
    text: "Grand écran 6,6 pouces à 90 Hz et batterie de 5 000 mAh qui dépasse facilement la journée.",
  },
  {
    categorySlug: "ordinateurs-portables",
    productSlug: "stratos-pro-16",
    tone: "lilac",
    title: "Une station de travail, à emporter.",
    text: "Écran 16 pouces 165 Hz, 32 Go de mémoire et carte graphique dédiée 8 Go pour le montage vidéo, la 3D et le développement.",
  },
];
