import type { FaqItem } from "@/lib/catalog/types";

/**
 * Guides d'achat éditoriaux. Format structuré (sections + tableaux) plutôt que
 * du texte libre : c'est ce que les moteurs et assistants IA citent le mieux.
 * À migrer vers MDX (`content/guides/`) quand le volume augmente.
 */

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  /** Réponse courte en tête d'article (format « réponse directe »). */
  tldr: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  sections: GuideSection[];
  table?: { caption: string; head: string[]; rows: string[][] };
  faq: FaqItem[];
}

export const guides: Guide[] = [
  {
    slug: "comment-choisir-son-smartphone",
    title: "Comment choisir son smartphone en 2026",
    description:
      "Mises à jour, autonomie, écran, photo : les critères qui comptent vraiment pour choisir un smartphone, dans le bon ordre.",
    tldr:
      "Fixez d'abord votre budget, puis priorisez dans cet ordre : durée des mises à jour logicielles, autonomie, qualité d'écran, photo, et enfin stockage. Au-delà de 128 Go, ne payez plus que si vous filmez beaucoup.",
    category: "smartphones",
    author: "L'équipe ElectroMarket",
    publishedAt: "2026-02-10",
    updatedAt: "2026-09-25",
    sections: [
      {
        heading: "1. La durée de mises à jour",
        paragraphs: [
          "C'est le critère le plus sous-estimé. Un smartphone qui reçoit des correctifs de sécurité pendant 5 ans ou plus restera utilisable bien plus longtemps, ce qui réduit le coût réel par année d'usage.",
        ],
      },
      {
        heading: "2. L'autonomie",
        paragraphs: [
          "La capacité en mAh n'est qu'un indicateur : l'efficacité du processeur et de l'écran compte autant. Visez au moins 4 500 mAh pour un écran de plus de 6,3 pouces.",
        ],
      },
      {
        heading: "3. L'écran",
        paragraphs: [
          "Un écran OLED offre de meilleurs contrastes ; un taux de rafraîchissement de 90 ou 120 Hz rend la navigation plus fluide.",
        ],
        bullets: [
          "Luminosité ≥ 1 000 nits pour une bonne lisibilité en extérieur",
          "120 Hz pour la fluidité, 90 Hz reste très correct",
        ],
      },
      {
        heading: "4. La photo",
        paragraphs: [
          "Le nombre de mégapixels importe moins que la taille du capteur et la stabilisation optique (OIS), décisive en basse lumière.",
        ],
      },
    ],
    table: {
      caption: "Repères selon votre usage",
      head: ["Usage", "Stockage conseillé", "Critère prioritaire"],
      rows: [
        ["Usage courant", "128 Go", "Autonomie"],
        ["Photo / vidéo", "256 Go et plus", "Stabilisation optique"],
        ["Jeu mobile", "256 Go", "Écran 120 Hz"],
      ],
    },
    faq: [
      {
        question: "Faut-il forcément un smartphone 5G ?",
        answer:
          "La quasi-totalité des modèles récents est compatible 5G. C'est utile si votre forfait l'inclut, mais ce n'est plus un critère différenciant.",
      },
    ],
  },
];

export function getGuides(): Guide[] {
  return guides;
}

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
