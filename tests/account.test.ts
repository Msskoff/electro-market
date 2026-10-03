import { describe, expect, it } from "vitest";
import { addressSchema, normalizeTogoPhone, parseAccount, profileSchema } from "@/lib/account/schema";

describe("normalizeTogoPhone", () => {
  it("accepte les formats courants et normalise en +228 XX XX XX XX", () => {
    expect(normalizeTogoPhone("90123456")).toBe("+228 90 12 34 56");
    expect(normalizeTogoPhone("90 12 34 56")).toBe("+228 90 12 34 56");
    expect(normalizeTogoPhone("+228 90 12 34 56")).toBe("+228 90 12 34 56");
    expect(normalizeTogoPhone("0022890123456")).toBe("+228 90 12 34 56");
  });
  it("refuse un numéro incomplet", () => {
    expect(normalizeTogoPhone("9012345")).toBeNull();
    expect(normalizeTogoPhone("abc")).toBeNull();
  });
});

describe("schémas du compte", () => {
  it("profil : champs obligatoires, e-mail facultatif mais valide", () => {
    expect(profileSchema.safeParse({ firstName: "Ama", lastName: "K.", phone: "90123456", email: "" }).success).toBe(true);
    expect(profileSchema.safeParse({ firstName: "", lastName: "K.", phone: "90123456", email: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ firstName: "Ama", lastName: "K.", phone: "90123456", email: "pas-un-mail" }).success).toBe(false);
  });
  it("adresse : quartier et téléphone requis", () => {
    const ok = addressSchema.safeParse({ id: "a1", label: "Domicile", district: "Bè", city: "Lomé", phone: "90123456" });
    expect(ok.success && ok.data.phone).toBe("+228 90 12 34 56");
    expect(addressSchema.safeParse({ id: "a1", label: "Domicile", district: "", city: "Lomé", phone: "90123456" }).success).toBe(false);
  });
  it("lecture tolérante : données absentes ou corrompues → compte vide", () => {
    expect(parseAccount(null)).toEqual({ version: 1, profile: null, addresses: [] });
    expect(parseAccount("{pas du json")).toEqual({ version: 1, profile: null, addresses: [] });
    expect(parseAccount(JSON.stringify({ version: 2 }))).toEqual({ version: 1, profile: null, addresses: [] });
  });
});
