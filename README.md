# ElectronikTogo — boutique e-commerce d'électronique (MVP)

MVP Next.js 16 / Tailwind v4 / TypeScript strict, pensé pour le **SEO** et la **visibilité dans les assistants IA**.
Les règles du projet sont dans [`CLAUDE.md`](./CLAUDE.md).

> ⚠️ Le catalogue (`src/lib/catalog/data.ts`) contient des **marques et produits fictifs** de démonstration.
> Remplacez-le par vos vrais produits avant toute mise en ligne, puis passez `demoMode` à `false` dans `src/config/site.ts`.

## Démarrer

```bash
npm install
cp .env.example .env.local   # renseigner NEXT_PUBLIC_SITE_URL
npm run dev                  # http://localhost:3000
npm run check                # lint + typecheck + tests
npm run build && npm start   # production
```

## Ce que contient le MVP

| Domaine | Inclus |
|---|---|
| Pages | Accueil, catégories, fiches produit, guides d'achat, aide/FAQ, panier, 404 |
| Achat | Choix des variantes (configuration, couleur), ajout au panier par Server Action, panier en cookie recalculé côté serveur, frais de port et seuil de gratuité |
| SEO | `generateMetadata` + canonical + Open Graph/Twitter, sitemap, robots, JSON-LD (OnlineStore, WebSite, Product/Offer, BreadcrumbList, FAQPage, ItemList, Article), image produit à URL stable |
| IA / GEO | `/llms.txt` généré depuis le catalogue, robots IA autorisés, résumés factuels, tableaux de specs HTML, FAQ, encadrés « En bref » |
| Design | Tokens clair/sombre sans flash, polices auto-hébergées, illustrations vectorielles teintées par variante, barre d'achat collante sur mobile |
| Qualité | Toutes les pages publiques en SSG, en-têtes de sécurité, validation Zod, 15 tests Vitest |

## Prochaines étapes

1. Brancher PostgreSQL (Supabase) en réimplémentant `src/lib/catalog/repository.ts`.
2. Remplacer `DeviceIllustration` par de vraies photos (`next/image`).
3. Tunnel de commande + paiement (`PAYMENT_PROVIDER`) avec tests Playwright.
4. Pages légales (mentions légales, CGV, confidentialité), filtres de catégorie, recherche, flux Google Merchant.
