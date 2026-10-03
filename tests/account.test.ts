import { describe, expect, it } from "vitest";
import { addressInputSchema, normalizeTogoPhone, profileSchema } from "@/lib/account/schema";
import { safeNextPath } from "@/lib/auth/redirect";
import { newPasswordSchema, signUpSchema } from "@/lib/auth/schema";

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
  it("profil : prénom, nom et téléphone requis", () => {
    expect(profileSchema.safeParse({ firstName: "Ama", lastName: "K.", phone: "90123456" }).success).toBe(true);
    expect(profileSchema.safeParse({ firstName: "", lastName: "K.", phone: "90123456" }).success).toBe(false);
  });
  it("adresse : quartier et téléphone requis, numéro normalisé", () => {
    const ok = addressInputSchema.safeParse({ label: "Domicile", district: "Bè", city: "Lomé", phone: "90123456" });
    expect(ok.success && ok.data.phone).toBe("+228 90 12 34 56");
    expect(addressInputSchema.safeParse({ label: "Domicile", district: "", city: "Lomé", phone: "90123456" }).success).toBe(false);
  });
});

describe("authentification", () => {
  it("inscription : e-mail normalisé, mot de passe de 8 caractères minimum", () => {
    const ok = signUpSchema.safeParse({ firstName: "Ama", lastName: "K.", email: "  Ama@Exemple.TG ", password: "motdepasse" });
    expect(ok.success && ok.data.email).toBe("ama@exemple.tg");
    expect(signUpSchema.safeParse({ firstName: "Ama", lastName: "K.", email: "ama@exemple.tg", password: "court" }).success).toBe(false);
  });
  it("nouveau mot de passe : la confirmation doit correspondre", () => {
    expect(newPasswordSchema.safeParse({ password: "motdepasse", confirm: "motdepasse" }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "motdepasse", confirm: "autre-chose" }).success).toBe(false);
  });
  it("redirection après connexion : chemins internes uniquement (pas de redirection ouverte)", () => {
    expect(safeNextPath("/compte#adresses")).toBe("/compte#adresses");
    expect(safeNextPath("//pirate.example")).toBe("/compte");
    expect(safeNextPath("https://pirate.example")).toBe("/compte");
    expect(safeNextPath(String.raw`/\pirate.example`)).toBe("/compte");
    expect(safeNextPath(undefined)).toBe("/compte");
  });
});
