/**
 * ⚠️ GÉNÉRATEUR DE CATALOGUE DE DÉMONSTRATION — produits et marques FICTIFS.
 *
 * Complète chaque catégorie jusqu'à `DEMO_PRODUCTS_PER_CATEGORY` références pour
 * tester l'interface à l'échelle (pagination, recherche, performances).
 * Déterministe : un générateur pseudo-aléatoire à graine fixe produit toujours
 * le même catalogue, donc les URL et SKU restent stables d'un build à l'autre.
 *
 * Les textes sont construits à partir des caractéristiques générées : ils restent
 * cohérents avec la fiche, mais ne remplacent pas des descriptions rédigées.
 * À supprimer dès que la base de données réelle est branchée.
 */
import type { Brand, DeviceKind, FaqItem, Product, SpecGroup, Variant } from "./types";

export const DEMO_PRODUCTS_PER_CATEGORY = 100;

export const demoBrands: Brand[] = [
  { slug: "veyra", name: "Veyra" },
  { slug: "oxen", name: "Oxen" },
  { slug: "lumio", name: "Lumio" },
  { slug: "pexa", name: "Pexa" },
  { slug: "corvane", name: "Corvane" },
  { slug: "talyx", name: "Talyx" },
  { slug: "sonaro", name: "Sonaro" },
  { slug: "ikora", name: "Ikora" },
];

/* ------------------------------------------------------------------ */
/* Aléatoire déterministe                                              */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T,>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)];
const chance = (rng: Rng, p: number) => rng() < p;
/** Arrondi commercial au multiple de 500 F CFA (prix en « …500 » ou « …000 »). */
const round500 = (n: number) => Math.max(500, Math.round(n / 500) * 500);

/** Nombre au format français avec espace normale (« 4 800 », « 6,4 »). */
function fr(n: number, decimals = 0): string {
  const [int, dec] = n.toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return dec ? `${grouped},${dec}` : grouped;
}

/** Article défini avec élision : « Le Kelvo… », « La Veyra… », « L'Ikora… ». */
function the(name: string, gender: "m" | "f"): string {
  return /^[aeiouyhéè]/i.test(name) ? `L'${name}` : `${gender === "m" ? "Le" : "La"} ${name}`;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isoDate(rng: Rng, fromYear: number, toYear: number): string {
  const y = int(rng, fromYear, toYear);
  const m = y === 2026 ? int(rng, 1, 8) : int(rng, 1, 12);
  return `${y}-${String(m).padStart(2, "0")}-${String(int(rng, 1, 28)).padStart(2, "0")}`;
}

function laterDate(rng: Rng, iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + int(rng, 20, 200));
  const cap = new Date("2026-09-28T00:00:00Z");
  return (d > cap ? cap : d).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Briques communes                                                    */
/* ------------------------------------------------------------------ */

interface Draft {
  name: string;
  brand: Brand;
  kind: DeviceKind;
  summary: string;
  description: string[];
  highlights: string[];
  specs: SpecGroup[];
  inTheBox: string[];
  faq: FaqItem[];
  /** Options (capacité, taille…) avec multiplicateur de prix. */
  options: { label?: string; factor: number }[];
  colors: { name: string; hex: string }[];
  basePrice: number;
}

const PALETTES = {
  dark: [
    { name: "Noir", hex: "#16181D" },
    { name: "Graphite", hex: "#2B2F36" },
    { name: "Nuit", hex: "#1C2230" },
    { name: "Gris sidéral", hex: "#3A3F47" },
  ],
  light: [
    { name: "Argent", hex: "#C7CBD1" },
    { name: "Blanc", hex: "#F2F3F5" },
    { name: "Glacier", hex: "#C9D6E3" },
    { name: "Sable", hex: "#D8CBB5" },
  ],
  vivid: [
    { name: "Sauge", hex: "#9DB4A0" },
    { name: "Corail", hex: "#E8806A" },
    { name: "Bleu nuit", hex: "#2C3E66" },
    { name: "Vert forêt", hex: "#2F5D4A" },
    { name: "Lavande", hex: "#A99BC8" },
    { name: "Bordeaux", hex: "#6B2737" },
  ],
} as const;

function pickColors(rng: Rng, count: number) {
  const pool = [pick(rng, PALETTES.dark), pick(rng, PALETTES.light), pick(rng, PALETTES.vivid)];
  return pool.slice(0, count);
}

/* ------------------------------------------------------------------ */
/* Smartphones                                                         */
/* ------------------------------------------------------------------ */

function smartphone(rng: Rng, brand: Brand, name: string, tier: 0 | 1 | 2): Draft {
  const size = int(rng, 61, 69) / 10;
  const tech = ["LCD, 90 Hz", "AMOLED, 120 Hz", "OLED LTPO, 120 Hz"][tier];
  const techShort = ["LCD 90 Hz", "AMOLED 120 Hz", "OLED 120 Hz"][tier];
  const nits = [int(rng, 6, 10) * 100, int(rng, 12, 18) * 100, int(rng, 20, 30) * 100][tier];
  const ram = [pick(rng, [4, 6]), 8, pick(rng, [12, 16])][tier];
  const storages = [[64, 128], [128, 256], [256, 512]][tier];
  const mp = [pick(rng, [13, 48, 50]), pick(rng, [50, 64]), pick(rng, [50, 108, 200])][tier];
  const ois = tier > 0 && chance(rng, tier === 2 ? 1 : 0.5);
  const battery = int(rng, 45, 60) * 100;
  const watts = [pick(rng, [18, 25]), pick(rng, [33, 45]), pick(rng, [45, 65, 80])][tier];
  const fiveG = tier > 0 || chance(rng, 0.4);
  const ip = [pick(rng, ["IP52", "Non communiquée"]), pick(rng, ["IP54", "IP67"]), "IP68"][tier];
  const weight = int(rng, 172, 226);
  const updates = [pick(rng, [2, 3]), pick(rng, [3, 4]), pick(rng, [5, 6, 7])][tier];
  const charger = tier === 0 || chance(rng, 0.3);

  const tierWord = ["d'entrée de gamme", "de milieu de gamme", "haut de gamme"][tier];
  const audience = [
    "un premier smartphone ou un usage simple (appels, messagerie, réseaux sociaux)",
    "un usage quotidien polyvalent, photo comprise",
    "ceux qui veulent le meilleur en photo, en écran et en durée de suivi logiciel",
  ][tier];
  const network = fiveG ? "compatible 5G" : "4G";

  return {
    name,
    brand,
    kind: "phone",
    summary: `${the(name, "m")} est un smartphone ${tierWord} de ${fr(size, 1)} pouces, ${network}. Il convient à ${audience}, avec une batterie de ${fr(battery)} mAh.`,
    description: [
      `Son écran ${techShort} affiche jusqu'à ${fr(nits)} nits pour rester lisible en extérieur. Le capteur principal de ${mp} Mpx${ois ? ", stabilisé optiquement," : ""} couvre l'essentiel des usages photo.`,
      `La charge ${watts} W permet de récupérer une bonne partie de l'autonomie en moins d'une heure. Le fabricant annonce ${updates} ans de mises à jour.`,
    ],
    highlights: [`${fr(size, 1)}" ${techShort}`, `${mp} Mpx${ois ? " OIS" : ""}`, `${fr(battery)} mAh`],
    specs: [
      {
        label: "Écran",
        specs: [
          { label: "Diagonale", value: `${fr(size, 1)} pouces` },
          { label: "Technologie", value: tech },
          { label: "Luminosité max.", value: `${fr(nits)} nits` },
        ],
      },
      {
        label: "Performances",
        specs: [
          { label: "Mémoire vive", value: `${ram} Go` },
          { label: "Réseau", value: fiveG ? "5G, Wi-Fi 6, Bluetooth 5.3" : "4G, Wi-Fi 5, Bluetooth 5.1" },
          { label: "Mises à jour annoncées", value: `${updates} ans` },
        ],
      },
      {
        label: "Photo",
        specs: [{ label: "Capteur principal", value: `${mp} Mpx${ois ? ", stabilisation optique" : ""}` }],
      },
      {
        label: "Batterie",
        specs: [
          { label: "Capacité", value: `${fr(battery)} mAh` },
          { label: "Charge filaire", value: `${watts} W` },
        ],
      },
      {
        label: "Dimensions",
        specs: [
          { label: "Poids", value: `${weight} g` },
          { label: "Étanchéité", value: ip },
        ],
      },
    ],
    inTheBox: [name, "Câble USB-C", ...(charger ? [`Chargeur ${watts} W`] : []), "Outil d'éjection SIM"],
    faq: [
      {
        question: `${the(name, "m")} est-il compatible 5G ?`,
        answer: fiveG
          ? "Oui, il est compatible 5G et fonctionne avec les réseaux Togocom et Moov Africa."
          : "Non, il fonctionne en 4G, ce qui reste suffisant pour la navigation, la vidéo et les appels.",
      },
      {
        question: "Le chargeur est-il fourni ?",
        answer: charger
          ? `Oui, un chargeur ${watts} W est inclus dans la boîte.`
          : "Non, seul un câble USB-C est fourni. Tout chargeur USB-C Power Delivery convient.",
      },
    ],
    options: storages.map((s, i) => ({ label: `${s} Go`, factor: 1 + i * 0.14 })),
    colors: pickColors(rng, int(rng, 1, 3)),
    basePrice: round500([int(rng, 65, 150), int(rng, 160, 320), int(rng, 350, 750)][tier] * 1000),
  };
}

/* ------------------------------------------------------------------ */
/* Ordinateurs portables                                               */
/* ------------------------------------------------------------------ */

function laptop(rng: Rng, brand: Brand, name: string, tier: 0 | 1 | 2): Draft {
  const size = pick(rng, [13.3, 14, 14, 15.6, 16]);
  const resolutions = [
    ["1 920 × 1 080", "Full HD"],
    ["2 560 × 1 600", "2,5K"],
    ["2 880 × 1 800", "2,8K"],
  ] as const;
  const [definition, resShort] = tier === 0 ? resolutions[0] : pick(rng, resolutions.slice(1));
  const hz = tier === 2 ? pick(rng, [120, 144, 165]) : 60;
  const cores = [pick(rng, [4, 6]), pick(rng, [8, 10]), pick(rng, [12, 14, 16])][tier];
  const ghz = [int(rng, 38, 42), int(rng, 44, 48), int(rng, 50, 56)][tier] / 10;
  const ram = [8, 16, pick(rng, [16, 32])][tier];
  const ssds = [[256, 512], [512, 1024], [1024, 2048]][tier];
  const gpu = tier === 2 && chance(rng, 0.6) ? `Dédiée, ${pick(rng, [6, 8, 12])} Go` : "Intégrée";
  const hours = [int(rng, 6, 10), int(rng, 10, 16), int(rng, 8, 20)][tier];
  const weight = size >= 15.6 ? int(rng, 17, 24) / 10 : int(rng, 11, 15) / 10;
  const usage = [
    "les études, la bureautique et le multimédia",
    "le travail nomade et le multitâche",
    gpu.startsWith("Dédiée") ? "la création (photo, vidéo, 3D) et le jeu" : "les professionnels exigeants qui veulent puissance et autonomie",
  ][tier];
  const ssdLabel = (gb: number) => (gb >= 1024 ? `${gb / 1024} To` : `${gb} Go`);

  return {
    name,
    brand,
    kind: "laptop",
    summary: `${the(name, "m")} est un ordinateur portable ${fr(size, size % 1 ? 1 : 0)} pouces pensé pour ${usage}. Il annonce jusqu'à ${hours} heures d'autonomie pour ${fr(weight, 1)} kg.`,
    description: [
      `Son processeur ${cores} cœurs monte jusqu'à ${fr(ghz, 1)} GHz, épaulé par ${ram} Go de mémoire vive. L'écran ${resShort}${hz > 60 ? ` ${hz} Hz` : ""} offre un affichage net pour le texte comme pour la vidéo.`,
      `Le stockage SSD NVMe garantit des démarrages rapides. ${gpu.startsWith("Dédiée") ? `Sa carte graphique dédiée (${gpu.split(", ")[1]}) accélère les logiciels de création.` : "La carte graphique est intégrée au processeur."}`,
    ],
    highlights: [`${fr(size, size % 1 ? 1 : 0)}" ${resShort}`, `${ram} Go RAM`, `${fr(weight, 1)} kg`],
    specs: [
      {
        label: "Écran",
        specs: [
          { label: "Diagonale", value: `${fr(size, size % 1 ? 1 : 0)} pouces` },
          { label: "Définition", value: `${definition} px` },
          { label: "Fréquence", value: `${hz} Hz` },
        ],
      },
      {
        label: "Performances",
        specs: [
          { label: "Processeur", value: `${cores} cœurs, jusqu'à ${fr(ghz, 1)} GHz` },
          { label: "Mémoire vive", value: `${ram} Go` },
          { label: "Carte graphique", value: gpu },
        ],
      },
      { label: "Autonomie", specs: [{ label: "Annoncée", value: `Jusqu'à ${hours} h` }] },
      { label: "Dimensions", specs: [{ label: "Poids", value: `${fr(weight, 1)} kg` }] },
    ],
    inTheBox: [name, `Chargeur USB-C ${tier === 2 ? 140 : 65} W`],
    faq: [
      {
        question: `${the(name, "m")} convient-il au montage vidéo ?`,
        answer: gpu.startsWith("Dédiée")
          ? "Oui, sa carte graphique dédiée accélère le rendu vidéo et les logiciels de création."
          : "Pour du montage léger en Full HD, oui. Pour la 4K ou les effets lourds, préférez un modèle à carte graphique dédiée.",
      },
    ],
    options: ssds.map((s, i) => ({ label: ssdLabel(s), factor: 1 + i * 0.18 })),
    colors: pickColors(rng, int(rng, 1, 2)),
    basePrice: round500([int(rng, 250, 420), int(rng, 450, 850), int(rng, 900, 1600)][tier] * 1000),
  };
}

/* ------------------------------------------------------------------ */
/* Assemblage                                                          */
/* ------------------------------------------------------------------ */

const SERIES: Record<string, { names: readonly string[]; suffixes: readonly [string, string, string] }> = {
  smartphones: { names: ["Nova", "Pulse", "Edge", "Vibe", "Spark", "Orbit", "Flux", "Zen", "Astra", "Mira"], suffixes: [" Lite", "", " Pro"] },
  "ordinateurs-portables": { names: ["Book", "Air", "Flex", "Swift", "Studio", "Core", "Vista", "Creator"], suffixes: [" Go", "", " Pro"] },
};

const CATEGORY_SEED: Record<string, number> = {
  smartphones: 101,
  "ordinateurs-portables": 202,
};

function build(rng: Rng, categorySlug: string, brand: Brand, name: string, tier: 0 | 1 | 2): Draft {
  return categorySlug === "ordinateurs-portables" ? laptop(rng, brand, name, tier) : smartphone(rng, brand, name, tier);
}

/**
 * Génère les produits manquants pour que chaque catégorie atteigne `perCategory`.
 * Les produits existants (rédigés à la main) sont conservés et passent en premier.
 */
export function generateDemoProducts(
  existing: Product[],
  categorySlugs: string[],
  brandPool: Brand[],
  perCategory = DEMO_PRODUCTS_PER_CATEGORY,
): Product[] {
  const usedSlugs = new Set(existing.map((p) => `${p.category}/${p.slug}`));
  const usedNames = new Set(existing.map((p) => p.name));
  const generated: Product[] = [];

  for (const categorySlug of categorySlugs) {
    const rng = mulberry32(CATEGORY_SEED[categorySlug] ?? categorySlug.length * 97);
    const series = SERIES[categorySlug] ?? SERIES.smartphones;
    const missing = perCategory - existing.filter((p) => p.category === categorySlug).length;

    for (let i = 0; i < missing; i++) {
      const brand = pick(rng, brandPool);
      const tier = pick(rng, [0, 0, 1, 1, 1, 2] as const);

      let name = "";
      for (let attempt = 0; attempt < 50 && (!name || usedNames.has(name)); attempt++) {
        name = `${brand.name} ${pick(rng, series.names)} ${int(rng, 2, 12)}${series.suffixes[tier]}`;
      }
      if (usedNames.has(name)) name = `${name} ${i + 2}`;
      usedNames.add(name);

      let slug = slugify(name);
      if (slug === "page" || usedSlugs.has(`${categorySlug}/${slug}`)) slug = `${slug}-${i + 2}`;
      usedSlugs.add(`${categorySlug}/${slug}`);

      const draft = build(rng, categorySlug, brand, name, tier);
      const code = `${categorySlug.slice(0, 2).toUpperCase()}${String(i + 1).padStart(3, "0")}`;
      const soldOut = chance(rng, 0.07);
      const onSale = chance(rng, 0.16);

      const variants: Variant[] = [];
      draft.options.forEach((option, oi) => {
        draft.colors.forEach((color, ci) => {
          const price = round500(draft.basePrice * option.factor);
          variants.push({
            sku: `DEMO-${code}-${oi}${ci}`,
            label: [option.label, color.name].filter(Boolean).join(" · "),
            option: option.label,
            color: { ...color },
            price,
            ...(onSale && oi === 0 && ci === 0 ? { compareAtPrice: round500(price * (1.08 + rng() * 0.22)) } : {}),
            stock: soldOut ? 0 : chance(rng, 0.12) ? int(rng, 1, 4) : int(rng, 5, 60),
          });
        });
      });

      const releasedAt = isoDate(rng, 2025, 2026);
      generated.push({
        id: `demo-${categorySlug}-${i + 1}`,
        slug,
        name: draft.name,
        brand: brand.slug,
        category: categorySlug,
        kind: draft.kind,
        summary: draft.summary,
        description: draft.description,
        highlights: draft.highlights,
        specs: draft.specs,
        inTheBox: draft.inTheBox,
        variants,
        faq: draft.faq,
        mpn: `${brand.slug.slice(0, 3).toUpperCase()}-${code}`,
        releasedAt,
        updatedAt: laterDate(rng, releasedAt),
      });
    }
  }

  return generated;
}
