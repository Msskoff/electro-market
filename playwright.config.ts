import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout du parcours d'achat (CLAUDE.md §13 : obligatoires pour le paiement).
 * Lancés sur le build de production local : `npm run build` puis `npm run test:e2e`.
 * Les scénarios connectés exigent un compte de TEST (E2E_EMAIL / E2E_PASSWORD dans
 * .env.local, jamais un compte réel) : sans eux, ils sont ignorés.
 */
const PORT = 3200;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    trace: "retain-on-failure",
  },
  // « Playwright » dans l'identifiant du navigateur : les tests ne faussent pas les statistiques (traités comme un robot).
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], userAgent: `${devices["Pixel 7"].userAgent} Playwright` } },
    { name: "ordinateur", use: { ...devices["Desktop Chrome"], userAgent: `${devices["Desktop Chrome"].userAgent} Playwright` } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
