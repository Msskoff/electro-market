import { describe, expect, it } from "vitest";
import { brands, categories, products } from "@/lib/catalog/data";
import { DEMO_PRODUCTS_PER_CATEGORY, generateDemoProducts } from "@/lib/catalog/demo-generator";
import { skuSchema } from "@/lib/cart/schema";

describe("catalogue de démonstration", () => {
  it(`contient ${DEMO_PRODUCTS_PER_CATEGORY} produits par catégorie`, () => {
    for (const c of categories) {
      expect(products.filter((p) => p.category === c.slug), c.slug).toHaveLength(DEMO_PRODUCTS_PER_CATEGORY);
    }
  });

  it("slugs et noms uniques, jamais « page » (réservé à la pagination)", () => {
    const keys = products.map((p) => `${p.category}/${p.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(products.map((p) => p.name)).size).toBe(products.length);
    expect(products.some((p) => p.slug === "page")).toBe(false);
  });

  it("SKU valides, prix entiers positifs, prix barré supérieur au prix", () => {
    for (const p of products) {
      for (const v of p.variants) {
        expect(skuSchema.safeParse(v.sku).success, v.sku).toBe(true);
        expect(Number.isInteger(v.price) && v.price > 0, v.sku).toBe(true);
        if (v.compareAtPrice !== undefined) expect(v.compareAtPrice).toBeGreaterThan(v.price);
      }
    }
  });

  it("fiches complètes : résumé, 3 points clés, caractéristiques, marque connue", () => {
    for (const p of products) {
      expect(p.summary.length, p.slug).toBeGreaterThan(40);
      expect(p.highlights.length, p.slug).toBeLessThanOrEqual(3);
      expect(p.specs.length, p.slug).toBeGreaterThan(0);
      expect(brands.some((b) => b.slug === p.brand), p.slug).toBe(true);
      expect(p.summary, p.slug).not.toMatch(/undefined|NaN/);
    }
  });

  it("génération déterministe (URL stables entre deux builds)", () => {
    const handcrafted = products.filter((p) => !p.id.startsWith("demo-"));
    const again = generateDemoProducts(handcrafted, categories.map((c) => c.slug), brands);
    expect(again.map((p) => p.slug)).toEqual(products.filter((p) => p.id.startsWith("demo-")).map((p) => p.slug));
  });
});
