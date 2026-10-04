import { describe, expect, it } from "vitest";
import { products } from "./fixtures/catalog";
import { priceCart } from "@/lib/cart/pricing";
import { MAX_QTY_PER_LINE, addLine, countItems, parseCart, setLineQty } from "@/lib/cart/schema";

const rules = { freeShippingThreshold: 50000, shippingCost: 2000 };

function lookupFor(skus: string[]) {
  const map = new Map();
  for (const product of products)
    for (const variant of product.variants)
      if (skus.includes(variant.sku)) map.set(variant.sku, { product, variant });
  return map;
}

describe("parseCart", () => {
  it("retourne un panier vide pour un cookie absent ou corrompu", () => {
    expect(parseCart(undefined)).toEqual([]);
    expect(parseCart("pas du json")).toEqual([]);
    expect(parseCart(JSON.stringify([{ sku: "<script>", qty: 1 }]))).toEqual([]);
    expect(parseCart(JSON.stringify([{ sku: "ABC-1", qty: 999 }]))).toEqual([]);
  });

  it("accepte un panier valide", () => {
    expect(parseCart(JSON.stringify([{ sku: "ABC-1", qty: 2 }]))).toEqual([{ sku: "ABC-1", qty: 2 }]);
  });
});

describe("addLine / setLineQty", () => {
  it("cumule les quantités et respecte le plafond", () => {
    let lines = addLine([], "ABC-1", 4);
    lines = addLine(lines, "ABC-1", 20);
    expect(lines).toEqual([{ sku: "ABC-1", qty: MAX_QTY_PER_LINE }]);
  });

  it("supprime la ligne quand la quantité vaut 0", () => {
    const lines = setLineQty([{ sku: "A", qty: 2 }, { sku: "B", qty: 1 }], "A", 0);
    expect(lines).toEqual([{ sku: "B", qty: 1 }]);
    expect(countItems(lines)).toBe(1);
  });
});

describe("priceCart", () => {
  it("recalcule les montants à partir du catalogue, jamais du client", () => {
    const cart = priceCart([{ sku: "AUR-ONE-128-GRA", qty: 2 }], lookupFor(["AUR-ONE-128-GRA"]), rules);
    expect(cart.subtotal).toBe(458500 * 2);
    expect(cart.shipping).toBe(0);
    expect(cart.total).toBe(917000);
  });

  it("facture la livraison sous le seuil", () => {
    const sku = "KEL-NEO6A-128-NUI";
    const cart = priceCart([{ sku, qty: 1 }], lookupFor([sku]), { ...rules, freeShippingThreshold: 500000 });
    expect(cart.shipping).toBe(2000);
    expect(cart.remainingForFreeShipping).toBe(500000 - 183000);
  });

  it("ignore les SKU inconnus et les produits épuisés, ajuste au stock", () => {
    const cart = priceCart(
      [
        { sku: "INCONNU-1", qty: 1 },
        { sku: "KEL-NEO6A-128-SAU", qty: 1 }, // stock 0
        { sku: "AUR-ONE-256-GRA", qty: 9 }, // stock 3
      ],
      lookupFor(["KEL-NEO6A-128-SAU", "AUR-ONE-256-GRA"]),
      rules,
    );
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({ qty: 3, adjusted: true });
  });

  it("panier vide : aucun frais de port", () => {
    expect(priceCart([], new Map(), rules).total).toBe(0);
  });
});

describe("mergeCartLines (connexion)", () => {
  it("garde le panier du compte et ajoute les articles choisis avant la connexion", async () => {
    const { mergeCartLines } = await import("@/lib/cart/schema");
    const merged = mergeCartLines(
      [{ sku: "A-1", qty: 1 }, { sku: "B-1", qty: 2 }],
      [{ sku: "B-1", qty: 1 }, { sku: "C-1", qty: 3 }],
    );
    expect(merged).toEqual([
      { sku: "A-1", qty: 1 },
      { sku: "B-1", qty: 2 }, // même article : la plus grande quantité, sans addition
      { sku: "C-1", qty: 3 },
    ]);
  });
  it("ne crée rien à partir de paniers vides (pas de remplissage par défaut)", async () => {
    const { mergeCartLines } = await import("@/lib/cart/schema");
    expect(mergeCartLines([], [])).toEqual([]);
  });
});

describe("hasAuthSession", () => {
  it("reconnaît une vraie session, pas les cookies temporaires d'inscription", async () => {
    const { hasAuthSession } = await import("@/lib/cart/client");
    expect(hasAuthSession("sb-abc-auth-token=xyz")).toBe(true);
    expect(hasAuthSession("vx_cart=1; sb-abc-auth-token.0=xyz")).toBe(true);
    expect(hasAuthSession("sb-abc-auth-token-code-verifier=xyz")).toBe(false);
    expect(hasAuthSession("vx_cart=[]")).toBe(false);
  });
});

describe("validation du panier sans Zod (navigateur)", () => {
  it("donne exactement le même verdict que le schéma Zod du serveur", async () => {
    const { validateCart } = await import("@/lib/cart/lines");
    const { cartSchema } = await import("@/lib/cart/schema");
    const samples: unknown[] = [
      [],
      [{ sku: "ABC-1", qty: 1 }],
      [{ sku: " ABC-1 ", qty: 10 }],
      [{ sku: "abc", qty: 1 }],
      [{ sku: "ABC", qty: 0 }],
      [{ sku: "ABC", qty: 11 }],
      [{ sku: "ABC", qty: 1.5 }],
      [{ sku: "ABC", qty: "2" }],
      [{ sku: "", qty: 1 }],
      [{ sku: "A".repeat(65), qty: 1 }],
      Array.from({ length: 31 }, (_, i) => ({ sku: `S${i}`, qty: 1 })),
      { sku: "ABC", qty: 1 },
      null,
      [null],
    ];
    for (const sample of samples) {
      const zod = cartSchema.safeParse(sample);
      expect(validateCart(sample)).toEqual(zod.success ? zod.data : null);
    }
  });
});
