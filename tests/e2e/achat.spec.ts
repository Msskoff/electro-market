import { expect, test, type Page } from "@playwright/test";

/**
 * Parcours d'achat : panier sans compte → identification → commande → suivi.
 * Le produit de référence est une fiche de démonstration stable.
 */
const PRODUCT = "/smartphones/aurion-one-5g";
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

async function addToCart(page: Page) {
  await page.goto(PRODUCT);
  await page.getByRole("button", { name: "Ajouter au panier" }).first().click();
  await expect(page.getByText("Ajouté au panier").first()).toBeVisible();
}

test.describe("visiteur sans compte", () => {
  test("ajoute au panier puis doit s'identifier pour commander, panier conservé", async ({ page }) => {
    await addToCart(page);
    await page.goto("/panier");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("panier");
    await page.getByRole("link", { name: "Valider mon panier" }).click();
    await expect(page).toHaveURL(/\/connexion\?suite=%2Fcommande/);
    await page.goto("/panier");
    await expect(page.getByText("Aurion One 5G").first()).toBeVisible();
  });

  test("la page de commande et le suivi sont réservés aux clients connectés", async ({ page }) => {
    await page.goto("/compte/commandes/ET-1001");
    await expect(page).toHaveURL(/\/connexion\?suite=/);
  });
});

test.describe("mesure d'audience", () => {
  // Aucun événement réel n'est enregistré : robots et requêtes invalides sont ignorés.
  test("ignore robots et requêtes invalides, sans jamais poser de cookie", async ({ request }) => {
    const bot = await request.post("/api/evenement", { data: { t: "pageview", p: "/" }, headers: { "user-agent": "Googlebot/2.1" } });
    expect(bot.status()).toBe(204);
    expect(bot.headers()["set-cookie"]).toBeUndefined();
    const bad = await request.post("/api/evenement", { data: { t: "inconnu", p: "x" } });
    expect(bad.status()).toBe(204);
  });
});

test.describe("client connecté (compte de test)", () => {
  test.skip(!email || !password, "E2E_EMAIL et E2E_PASSWORD non définis : scénario ignoré.");

  test("commande avec paiement à la livraison, puis annulation (stock rendu)", async ({ page }) => {
    await page.goto("/connexion?suite=%2Fcommande");
    await page.getByLabel("E-mail").fill(email!);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(/\/(commande|panier|compte)/);

    await addToCart(page);
    await page.goto("/commande");
    await expect(page.getByRole("heading", { name: "Finaliser ma commande" })).toBeVisible();
    // Le compte de test doit avoir au moins une adresse enregistrée.
    await page.getByLabel(/Paiement à la livraison/).check();
    await page.getByRole("button", { name: /Valider la commande/ }).click();

    await expect(page).toHaveURL(/\/compte\/commandes\/ET-\d+\?nouvelle=1/);
    await expect(page.getByText("Votre commande est enregistrée")).toBeVisible();
    await expect(page.getByText("Confirmée, en préparation").first()).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Annuler ma commande" }).click();
    await expect(page.getByText("Annulée").first()).toBeVisible();
  });

  test("mobile money : le numéro s'affiche au choix et la preuve est demandée", async ({ page }) => {
    await page.goto("/connexion?suite=%2Fpanier");
    await page.getByLabel("E-mail").fill(email!);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(/\/(panier|compte)/);
    await addToCart(page);
    await page.goto("/commande");
    const moov = page.getByLabel(/Moov/);
    test.skip((await moov.count()) === 0, "Moov Money non activé dans la configuration.");
    await moov.check();
    await expect(page.getByText("Numéro à créditer")).toBeVisible();
    await page.getByRole("button", { name: /Valider la commande/ }).click();
    await expect(page.getByRole("heading", { name: /Déposez la preuve de paiement/ })).toBeVisible();
    await expect(page.getByLabel("Référence de la transaction")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Annuler ma commande" }).click();
    await expect(page.getByText("Annulée").first()).toBeVisible();
  });
});
