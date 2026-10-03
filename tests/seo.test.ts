import { describe, expect, it } from "vitest";
import { brands, categories, products } from "@/lib/catalog/data";
import { defaultVariant, priceRange } from "@/lib/catalog/selectors";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { clampDescription } from "@/lib/seo/metadata";

describe("catalogue", () => {
  it("chaque produit référence une catégorie et une marque existantes", () => {
    for (const p of products) {
      expect(categories.some((c) => c.slug === p.category), p.slug).toBe(true);
      expect(brands.some((b) => b.slug === p.brand), p.slug).toBe(true);
    }
  });

  it("les SKU sont uniques", () => {
    const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("defaultVariant privilégie la variante disponible la moins chère", () => {
    const neo = products.find((p) => p.slug === "kelvo-neo-6a")!;
    expect(defaultVariant(neo).stock).toBeGreaterThan(0);
    const one = products.find((p) => p.slug === "aurion-one-5g")!;
    expect(priceRange(one)).toEqual({ min: 458500, max: 524000 });
  });
});

describe("JSON-LD", () => {
  const product = products[0];
  const brand = brands.find((b) => b.slug === product.brand)!;
  const category = categories.find((c) => c.slug === product.category)!;

  it("Product : une offre par variante, prix et disponibilité", () => {
    const ld = productJsonLd(product, brand, category) as { offers: Record<string, unknown>[] };
    expect(ld.offers).toHaveLength(product.variants.length);
    expect(ld.offers[0]).toMatchObject({
      price: "458500",
      priceCurrency: "XOF",
      availability: "https://schema.org/InStock",
    });
  });

  it("BreadcrumbList : positions à partir de 1 et URL absolues", () => {
    const ld = breadcrumbJsonLd([{ name: "Accueil", path: "/" }]) as {
      itemListElement: { position: number; item: string }[];
    };
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[0].item).toMatch(/^https?:\/\//);
  });

  it("FAQPage : null si aucune question", () => {
    expect(faqJsonLd([])).toBeNull();
  });
});

describe("clampDescription", () => {
  it("respecte la longueur maximale sans couper un mot", () => {
    const out = clampDescription("mot ".repeat(80));
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("frenchSpacing", () => {
  it("insère des espaces insécables avant ? ! ; : et dans « »", async () => {
    const { frenchSpacing } = await import("@/lib/utils/typography");
    expect(frenchSpacing("Quelle garantie ?")).toBe("Quelle garantie ?");
    expect(frenchSpacing("Capteurs : GPS")).toBe("Capteurs : GPS");
    expect(frenchSpacing("« casque »")).toBe("« casque »");
    expect(frenchSpacing("à 10:30")).toBe("à 10:30");
  });
});

describe("recherche partagée (suggestions + page de résultats)", () => {
  it("insensible aux accents et à la casse, tous les mots requis, nom prioritaire", async () => {
    const { normalize, queryTerms, relevance, highlightParts } = await import("@/lib/catalog/search");
    const terms = queryTerms("  ÉCRAN  oled ");
    expect(terms).toEqual(["ecran", "oled"]);
    expect(relevance(normalize("Aurion One 5G"), normalize("aurion one 5g ecran oled"), terms)).toBeGreaterThan(0);
    expect(relevance(normalize("Kelvo Neo"), normalize("kelvo neo lcd"), terms)).toBe(0);
    const name = normalize("Aurion One 5G");
    expect(relevance(name, name, queryTerms("aurion"))).toBeGreaterThan(relevance(name, name, queryTerms("one")));
    expect(highlightParts("Écran Pro", ["ecran"])).toEqual([{ text: "Écran", match: true }, { text: " Pro", match: false }]);
  });
});
