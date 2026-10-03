/**
 * ⚠️ DONNÉES DE DÉMONSTRATION — marques et produits FICTIFS.
 *
 * Ce fichier sert uniquement à faire tourner le MVP. Il doit être remplacé par
 * la base de données (PostgreSQL) avec vos vrais produits, caractéristiques
 * vérifiées et prix réels. Ne jamais publier ces données en production.
 *
 * Seul `repository.ts` a le droit d'importer ce fichier.
 */
import { demoBrands, generateDemoProducts } from "./demo-generator";
import type { Brand, Category, Product } from "./types";

export const brands: Brand[] = [
  { slug: "aurion", name: "Aurion" },
  { slug: "kelvo", name: "Kelvo" },
  { slug: "nuvia", name: "Nuvia" },
  { slug: "stratos", name: "Stratos" },
  ...demoBrands,
];

export const categories: Category[] = [
  {
    slug: "smartphones",
    name: "Smartphones",
    singular: "smartphone",
    kind: "phone",
    tagline: "5G, photo, autonomie",
    intro:
      "Notre sélection de smartphones 5G débloqués, tous opérateurs. Chaque modèle est présenté avec sa fiche technique complète, son autonomie mesurée et la durée de mises à jour annoncée par le fabricant.",
    faq: [
      {
        question: "Vos smartphones sont-ils débloqués ?",
        answer:
          "Oui, tous les smartphones vendus sont neufs, débloqués et compatibles avec les réseaux Togocom et Moov Africa.",
      },
      {
        question: "Quelle capacité de stockage choisir ?",
        answer:
          "128 Go suffisent pour un usage courant. Optez pour 256 Go ou plus si vous filmez en 4K ou conservez beaucoup de photos sans sauvegarde en ligne.",
      },
    ],
  },
  {
    slug: "ordinateurs-portables",
    name: "Ordinateurs portables",
    singular: "ordinateur portable",
    kind: "laptop",
    tagline: "Ultraportables et stations mobiles",
    intro:
      "Des ordinateurs portables pour étudier, travailler ou créer. Nous détaillons processeur, mémoire, qualité d'écran et autonomie réelle pour vous aider à choisir sans surpayer.",
    faq: [
      {
        question: "16 Go de mémoire vive sont-ils nécessaires ?",
        answer:
          "Pour la bureautique, 8 Go restent utilisables, mais 16 Go offrent une marge confortable pour le multitâche et plusieurs années d'utilisation.",
      },
    ],
  },
];

/** Fiches rédigées à la main (mises en avant sur l'accueil). */
const handcraftedProducts: Product[] = [
  {
    id: "p-aurion-one",
    slug: "aurion-one-5g",
    name: "Aurion One 5G",
    brand: "aurion",
    category: "smartphones",
    kind: "phone",
    summary:
      "L'Aurion One 5G est un smartphone 6,4 pouces pensé pour la photo et l'autonomie. Il s'adresse à ceux qui veulent un appareil haut de gamme compact, avec 5 ans de mises à jour annoncées.",
    description: [
      "Son écran OLED 120 Hz reste lisible en plein soleil grâce à une luminosité maximale de 2 000 nits. Le capteur principal de 50 Mpx, stabilisé optiquement, produit des photos de nuit détaillées.",
      "La batterie de 4 800 mAh tient une journée et demie en usage mixte, et se recharge à 50 % en 25 minutes avec un chargeur 45 W (non fourni).",
    ],
    highlights: ["6,4\" OLED 120 Hz", "50 Mpx OIS", "4 800 mAh"],
    specs: [
      {
        label: "Écran",
        specs: [
          { label: "Diagonale", value: "6,4 pouces" },
          { label: "Technologie", value: "OLED, 120 Hz" },
          { label: "Définition", value: "2 400 × 1 080 px" },
          { label: "Luminosité max.", value: "2 000 nits" },
        ],
      },
      {
        label: "Performances",
        specs: [
          { label: "Mémoire vive", value: "8 Go" },
          { label: "Réseau", value: "5G, Wi-Fi 6E, Bluetooth 5.3" },
        ],
      },
      {
        label: "Photo",
        specs: [
          { label: "Capteur principal", value: "50 Mpx, stabilisation optique" },
          { label: "Ultra grand-angle", value: "12 Mpx" },
          { label: "Selfie", value: "12 Mpx" },
        ],
      },
      {
        label: "Batterie",
        specs: [
          { label: "Capacité", value: "4 800 mAh" },
          { label: "Charge filaire", value: "45 W" },
          { label: "Charge sans fil", value: "15 W" },
        ],
      },
      {
        label: "Dimensions",
        specs: [
          { label: "Poids", value: "187 g" },
          { label: "Étanchéité", value: "IP68" },
        ],
      },
    ],
    inTheBox: ["Aurion One 5G", "Câble USB-C vers USB-C", "Outil d'éjection SIM"],
    variants: [
      { sku: "AUR-ONE-128-GRA", label: "128 Go · Graphite", option: "128 Go", color: { name: "Graphite", hex: "#2B2F36" }, price: 458500, stock: 24, gtin: "0000000000017" },
      { sku: "AUR-ONE-256-GRA", label: "256 Go · Graphite", option: "256 Go", color: { name: "Graphite", hex: "#2B2F36" }, price: 524000, stock: 3, gtin: "0000000000024" },
      { sku: "AUR-ONE-256-GLA", label: "256 Go · Glacier", option: "256 Go", color: { name: "Glacier", hex: "#C9D6E3" }, price: 524000, compareAtPrice: 557000, stock: 11, gtin: "0000000000031" },
    ],
    faq: [
      { question: "L'Aurion One 5G est-il compatible eSIM ?", answer: "Oui, il accepte une nano-SIM et une eSIM simultanément." },
      { question: "Le chargeur est-il fourni ?", answer: "Non, seul un câble USB-C est inclus. Tout chargeur USB-C Power Delivery fonctionne." },
    ],
    mpn: "AUR1-5G",
    featured: true,
    releasedAt: "2026-03-12",
    updatedAt: "2026-09-20",
  },
  {
    id: "p-kelvo-neo",
    slug: "kelvo-neo-6a",
    name: "Kelvo Neo 6a",
    brand: "kelvo",
    category: "smartphones",
    kind: "phone",
    summary:
      "Le Kelvo Neo 6a est un smartphone 5G de milieu de gamme au rapport qualité-prix soigné. Il convient à un usage quotidien avec un grand écran fluide et une très bonne autonomie.",
    description: [
      "Son écran 6,6 pouces à 90 Hz offre une navigation fluide, et la batterie de 5 000 mAh dépasse facilement la journée.",
    ],
    highlights: ["6,6\" 90 Hz", "5 000 mAh", "5G"],
    specs: [
      { label: "Écran", specs: [{ label: "Diagonale", value: "6,6 pouces" }, { label: "Technologie", value: "LCD, 90 Hz" }] },
      { label: "Performances", specs: [{ label: "Mémoire vive", value: "6 Go" }, { label: "Réseau", value: "5G, Wi-Fi 5" }] },
      { label: "Batterie", specs: [{ label: "Capacité", value: "5 000 mAh" }, { label: "Charge filaire", value: "25 W" }] },
    ],
    inTheBox: ["Kelvo Neo 6a", "Câble USB-C", "Coque de protection"],
    variants: [
      { sku: "KEL-NEO6A-128-NUI", label: "128 Go · Nuit", option: "128 Go", color: { name: "Nuit", hex: "#1C2230" }, price: 183000, stock: 40 },
      { sku: "KEL-NEO6A-128-SAU", label: "128 Go · Sauge", option: "128 Go", color: { name: "Sauge", hex: "#9DB4A0" }, price: 183000, stock: 0 },
    ],
    faq: [],
    releasedAt: "2026-01-20",
    updatedAt: "2026-09-02",
  },
  {
    id: "p-nuvia-book",
    slug: "nuvia-book-14-air",
    name: "Nuvia Book 14 Air",
    brand: "nuvia",
    category: "ordinateurs-portables",
    kind: "laptop",
    summary:
      "Le Nuvia Book 14 Air est un ultraportable de 1,2 kg avec écran 14 pouces 2,8K. Idéal pour les étudiants et les professionnels nomades, il annonce jusqu'à 15 heures d'autonomie.",
    description: [
      "Son châssis en aluminium de 14 mm d'épaisseur se glisse dans n'importe quel sac. L'écran 2,8K couvre 100 % de l'espace sRGB.",
      "Deux ports USB-C (dont un Thunderbolt), une prise jack et une webcam 1080p complètent l'équipement.",
    ],
    highlights: ["14\" 2,8K", "16 Go RAM", "1,2 kg"],
    specs: [
      { label: "Écran", specs: [{ label: "Diagonale", value: "14 pouces" }, { label: "Définition", value: "2 880 × 1 800 px" }, { label: "Couverture", value: "100 % sRGB" }] },
      { label: "Performances", specs: [{ label: "Mémoire vive", value: "16 Go" }, { label: "Stockage", value: "SSD NVMe" }] },
      { label: "Connectique", specs: [{ label: "Ports", value: "2 × USB-C (dont 1 Thunderbolt), jack 3,5 mm" }, { label: "Sans fil", value: "Wi-Fi 6E, Bluetooth 5.3" }] },
      { label: "Batterie", specs: [{ label: "Autonomie annoncée", value: "Jusqu'à 15 h" }] },
      { label: "Dimensions", specs: [{ label: "Poids", value: "1,2 kg" }, { label: "Épaisseur", value: "14 mm" }] },
    ],
    inTheBox: ["Nuvia Book 14 Air", "Chargeur USB-C 65 W", "Câble USB-C"],
    variants: [
      { sku: "NUV-BK14-512-ARG", label: "512 Go · Argent", option: "512 Go", color: { name: "Argent", hex: "#C7CBD1" }, price: 721000, stock: 8 },
      { sku: "NUV-BK14-1TO-ARG", label: "1 To · Argent", option: "1 To", color: { name: "Argent", hex: "#C7CBD1" }, price: 852000, stock: 4 },
    ],
    faq: [
      { question: "Peut-on ajouter de la mémoire vive ?", answer: "Non, la mémoire est soudée. Choisissez la configuration adaptée dès l'achat." },
    ],
    featured: true,
    releasedAt: "2026-02-03",
    updatedAt: "2026-09-15",
  },
  {
    id: "p-stratos-pro",
    slug: "stratos-pro-16",
    name: "Stratos Pro 16",
    brand: "stratos",
    category: "ordinateurs-portables",
    kind: "laptop",
    summary:
      "Le Stratos Pro 16 est une station de travail mobile pour la création et le développement. Écran 16 pouces 165 Hz, 32 Go de mémoire et carte graphique dédiée.",
    description: [
      "Pensé pour le montage vidéo, la 3D et la compilation, il conserve un clavier complet avec pavé numérique.",
    ],
    highlights: ["16\" 165 Hz", "32 Go RAM", "GPU dédié"],
    specs: [
      { label: "Écran", specs: [{ label: "Diagonale", value: "16 pouces" }, { label: "Fréquence", value: "165 Hz" }] },
      { label: "Performances", specs: [{ label: "Mémoire vive", value: "32 Go" }, { label: "Graphique", value: "Carte graphique dédiée 8 Go" }] },
      { label: "Dimensions", specs: [{ label: "Poids", value: "2,1 kg" }] },
    ],
    inTheBox: ["Stratos Pro 16", "Chargeur 140 W"],
    variants: [
      { sku: "STR-PRO16-1TO-GRI", label: "1 To · Gris sidéral", option: "1 To", color: { name: "Gris sidéral", hex: "#3A3F47" }, price: 1442500, stock: 6 },
    ],
    faq: [],
    releasedAt: "2026-05-28",
    updatedAt: "2026-09-10",
  },
];

/** Catalogue complet : fiches rédigées + produits générés (100 par catégorie). */
export const products: Product[] = [
  ...handcraftedProducts,
  ...generateDemoProducts(
    handcraftedProducts,
    categories.map((c) => c.slug),
    brands,
  ),
];
