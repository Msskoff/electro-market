# ElectronikTogo — boutique en ligne de smartphones et d'ordinateurs portables (Lomé)

Next.js 16 · Tailwind v4 · TypeScript strict · Supabase (catalogue, configuration, comptes) · Vercel.
Les règles du projet sont dans [`CLAUDE.md`](./CLAUDE.md).

## Démarrer

```bash
npm install
cp .env.example .env.local   # renseigner l'URL et la clé publishable Supabase
npm run dev                  # http://localhost:3000
npm run check                # lint + typecheck + tests
npm run build && npm start   # production
```

## Gérer la boutique

Tout le contenu (produits, photos, stock, catégories, marques, coordonnées, livraison, accueil, FAQ)
se modifie dans **`/admin`** (comptes de la table `admins`) : brouillon, puis « Publier ».

## Avant le lancement

1. Remplacer les produits de démonstration par le vrai catalogue (`/admin/produits`).
2. Renseigner les vraies coordonnées et politiques (`/admin/configuration`).
3. Nom de domaine sur Vercel, puis `NEXT_PUBLIC_SITE_URL` et `SITE_INDEXING=true`.
4. Supabase : URL du site et redirections, e-mails (SMTP), protection des mots de passe divulgués.
5. Paiement (`PAYMENT_PROVIDER`) avec tests E2E ; pages légales.
