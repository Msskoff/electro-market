import { describe, expect, it } from "vitest";
import { deviceOf, isBot, sourceOf, visitorId } from "@/lib/analytics/server";
import { settingsSchema } from "@/lib/admin/schemas";
import { priceCart } from "@/lib/cart/pricing";
import { withDefaults } from "@/lib/settings/repository";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";
import { adminNextActions, customerCanCancel, ORDER_STATUSES, trackingSteps } from "@/lib/orders/status";

describe("statuts de commande", () => {
  it("chaque statut a des actions admin cohérentes avec la base", () => {
    expect(adminNextActions("payment_review", "moov").map((a) => a.status)).toEqual(["to_ship", "awaiting_payment", "cancelled"]);
    expect(adminNextActions("to_ship", "cod").map((a) => a.status)).toEqual(["shipped", "delivered", "cancelled"]);
    expect(adminNextActions("delivered", "cod")).toEqual([]);
    expect(adminNextActions("cancelled", "moov")).toEqual([]);
    // Refuser une preuve exige un message au client.
    expect(adminNextActions("payment_review", "mixx").find((a) => a.status === "awaiting_payment")?.needsMessage).toBe(true);
  });

  it("le client n'annule que ce qui n'est ni payé ni expédié", () => {
    expect(customerCanCancel("awaiting_payment", "moov")).toBe(true);
    expect(customerCanCancel("to_ship", "cod")).toBe(true);
    expect(customerCanCancel("to_ship", "moov")).toBe(false); // déjà payé
    expect(customerCanCancel("payment_review", "moov")).toBe(false);
    expect(customerCanCancel("shipped", "cod")).toBe(false);
  });

  it("le suivi couvre tous les statuts sauf l'annulation", () => {
    const covered = trackingSteps("moov").flatMap((s) => s.key);
    expect(ORDER_STATUSES.filter((s) => !covered.includes(s))).toEqual(["cancelled"]);
  });
});

describe("frais de livraison : mêmes règles que place_order (SQL)", () => {
  const rules = { freeShippingThreshold: 50000, shippingCost: 2000 };
  const lookup = (price: number) =>
    new Map([["A-1", { product: { id: "p" } as never, variant: { sku: "A-1", price, stock: 5 } as never }]]);
  it("payante sous le seuil, offerte à partir du seuil", () => {
    expect(priceCart([{ sku: "A-1", qty: 1 }], lookup(49999), rules).shipping).toBe(2000);
    expect(priceCart([{ sku: "A-1", qty: 1 }], lookup(50000), rules).shipping).toBe(0);
  });
});

describe("configuration du paiement", () => {
  const valid = withDefaults({});
  it("valeurs par défaut : seul le paiement à la livraison est actif", () => {
    expect(valid.payment.methods.map((m) => [m.id, m.enabled])).toEqual([
      ["moov", false],
      ["mixx", false],
      ["cod", true],
    ]);
    expect(settingsSchema.safeParse(valid).success).toBe(true);
  });

  it("un mobile money actif exige un numéro", () => {
    const s = structuredClone(DEFAULT_SETTINGS);
    s.payment.methods[0].enabled = true;
    const r = settingsSchema.safeParse(s);
    expect(r.success).toBe(false);
    s.payment.methods[0].number = "+228 99 00 00 00";
    expect(settingsSchema.safeParse(s).success).toBe(true);
  });

  it("au moins un moyen actif", () => {
    const s = structuredClone(DEFAULT_SETTINGS);
    s.payment.methods[2].enabled = false;
    expect(settingsSchema.safeParse(s).success).toBe(false);
  });

  it("une configuration enregistrée partiellement garde les 3 moyens", () => {
    const merged = withDefaults({ payment: { methods: [{ id: "moov", enabled: true, number: "+228 90 11 22 33" }] } } as never);
    expect(merged.payment.methods).toHaveLength(3);
    expect(merged.payment.methods[0]).toMatchObject({ id: "moov", enabled: true, number: "+228 90 11 22 33", label: "Moov Money (Flooz)" });
  });
});

describe("mesure d'audience anonyme", () => {
  it("identifiant stable dans la journée, différent le lendemain, sans IP lisible", () => {
    const a = visitorId("41.207.1.2", "Mozilla/5.0", "2026-10-04");
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(visitorId("41.207.1.2", "Mozilla/5.0", "2026-10-04")).toBe(a);
    expect(visitorId("41.207.1.2", "Mozilla/5.0", "2026-10-05")).not.toBe(a);
    expect(a).not.toContain("41");
  });

  it("robots ignorés, appareils reconnus", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot("Mozilla/5.0 (Linux; Android 14; SM-A155F) AppleWebKit/537.36 Chrome/129 Mobile Safari/537.36")).toBe(false);
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("mobile");
    expect(deviceOf("Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Safari/537.36")).toBe("tablet");
    expect(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
  });

  it("provenance lisible", () => {
    const host = "electro-market-one.vercel.app";
    expect(sourceOf("https://www.google.com/", undefined, host)).toBe("Google");
    expect(sourceOf("https://l.facebook.com/l.php?u=x", undefined, host)).toBe("Facebook");
    expect(sourceOf(undefined, "WhatsApp", host)).toBe("WhatsApp");
    expect(sourceOf("https://electro-market-one.vercel.app/smartphones", undefined, host)).toBe("Direct");
    expect(sourceOf("", undefined, host)).toBe("Direct");
    expect(sourceOf("https://blog.exemple.tg/article", undefined, host)).toBe("blog.exemple.tg");
  });
});
