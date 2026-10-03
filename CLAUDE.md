# CLAUDE.md — Boutique e-commerce d'appareils électroniques

Ce fichier guide Claude (et tout développeur) sur ce projet. Le lire en entier avant toute modification. En cas de conflit entre une demande ponctuelle et ce fichier, demander confirmation.

---

## 1. Vision du projet

Site e-commerce personnel spécialisé dans la vente de **smartphones et d'ordinateurs portables** uniquement (les catégories audio, tablettes et montres connectées ont été retirées ; leurs anciennes URL redirigent en 308 vers l'accueil via `next.config.ts`).

Trois objectifs non négociables :

1. **Design professionnel et distinctif**, pensé pour le high-tech : précis, sobre, technique, premium. Jamais un template générique.
2. **Référencement naturel (SEO) excellent** sur Google, Bing et les autres moteurs.
3. **Visibilité dans les assistants IA** (ChatGPT, Claude, Perplexity, Gemini, Copilot) : le contenu doit être lisible, structuré et citable par les modèles (GEO / AEO).

Chaque décision technique ou visuelle doit servir au moins un de ces trois objectifs, sans dégrader les deux autres.

---

## 2. Stack technique

| Couche | Choix | Raison |
|---|---|---|
| Framework | **Next.js 16 (App Router, Turbopack)**, TypeScript strict | Rendu serveur (SSR/SSG/ISR) indispensable au SEO et aux robots IA |
| Style | **Tailwind CSS v4** + design tokens en variables CSS | Cohérence du design system (thème clair uniquement pour l'instant) |
| Composants | Composants maison (+ Radix UI pour l'accessibilité des primitives) | Design distinctif, pas de look « kit UI » |
| Base de données | **PostgreSQL** (Supabase) + ORM (Drizzle ou Prisma) — *MVP : données en mémoire derrière `repository.ts`* | Catalogue relationnel, variantes, stocks |
| Authentification | **Supabase Auth** — e-mail + mot de passe (projet `electromarket`, région Paris `eu-west-3`) | Comptes clients ; admin à venir |
| Paiement | Prestataire configurable via `PAYMENT_PROVIDER` (Stripe, PayPal, ou passerelle locale) | Adapter au pays de vente |
| Images | `next/image`, formats AVIF/WebP, CDN | Performance (LCP) |
| Recherche | Postgres full-text (puis Meilisearch/Algolia si le catalogue grossit) | Recherche produit rapide |
| Hébergement | Vercel (ou équivalent edge) | ISR, CDN, preview deployments |
| Analytics | Solution respectueuse de la vie privée (Plausible / Vercel Analytics) + Google Search Console + Bing Webmaster Tools | Suivi SEO sans bandeau cookie lourd |
| Tests | Vitest (unitaire), Playwright (E2E), Lighthouse CI | Qualité et non-régression SEO/perf |

**Règle :** aucun contenu indexable (fiche produit, catégorie, FAQ) ne doit dépendre du JavaScript client pour s'afficher. Tout est rendu côté serveur.

---

## 3. Commandes

```bash
npm install            # installer les dépendances
npm run dev            # serveur de développement (http://localhost:3000)
npm run build          # build de production
npm run start          # lancer le build
npm run lint           # ESLint
npm run typecheck      # next typegen + tsc --noEmit
npm run test           # tests unitaires (Vitest)
npm run check          # lint + typecheck + test (à lancer avant chaque commit)
```

À ajouter avec les étapes suivantes : `test:e2e` (Playwright), `lighthouse`, `db:migrate`, `db:seed`.

Avant de déclarer une tâche terminée : `npm run check` et `npm run build` doivent passer.

---

## 4. Arborescence (état actuel du MVP)

```
src/
  app/
    layout.tsx                         # Layout racine : polices, thème, header/footer, JSON-LD Organization/WebSite
    globals.css                        # Tailwind v4 + mapping des tokens
    fonts.ts                           # Polices auto-hébergées (next/font/local + @fontsource)
    (shop)/
      page.tsx                         # Accueil
      [categorie]/page.tsx             # Page catégorie (SSG, page 1)
      [categorie]/page/[page]/page.tsx # Pages 2…n de la catégorie (SSG, 24 produits par page)
      [categorie]/[slug]/page.tsx      # Fiche produit (SSG)
      [categorie]/[slug]/visuel.png/   # Image produit à URL stable (OG + JSON-LD)
      faq/page.tsx                     # Aide : livraison, retours, garantie
      panier/page.tsx                  # Panier (dynamique, noindex)
      recherche/page.tsx               # Recherche interne (dynamique, noindex)
      compte/page.tsx                  # Espace client « Mon compte » (dynamique, noindex)
      connexion/, inscription/, mot-de-passe-oublie/, reinitialiser-mot-de-passe/  # Authentification (noindex)
    auth/callback/route.ts           # Retour des liens e-mail (échange de code PKCE → session)
    api/suggestions/route.ts           # Index JSON statique des suggestions de recherche
    sitemap.ts · robots.ts · llms.txt/route.ts · partage.png/route.tsx · icon.svg · not-found.tsx
  proxy.ts                           # Proxy Next.js 16 (ex-middleware) : rafraîchit la session, pages privées uniquement
  components/
    ui/        # Primitives : Button/ButtonLink, Badge/SpecChip, Price, StockStatus, Container, SectionHeading, Icon
    product/   # ProductCard, ProductGrid, ProductHero, QuickAddButton, OptionGroup, AddToCartButton, SpecTable, DeviceIllustration, kindIcon
    content/   # Faq, TrustBar
    home/      # hero/ (HeroShowcase, HeroScene), CategoryCircles, PromoTiles, ReviewsSection, HelpBand
    catalog/   # CategoryView (contenu d'une page de catégorie), Pagination
    layout/    # SiteHeader, SiteFooter, SearchForm, CategoryMenu, NavLink, Breadcrumbs, AccountLink, CartLink, Logo
    account/   # AccountView, ProfileSection, AddressesSection, DeleteAccount
    auth/      # AuthShell, AuthForms (connexion, inscription, mot de passe oublié / nouveau)
    forms/     # Field, PasswordField (bouton Afficher), SubmitButton (état en cours), FormAlert
    cart/      # CartLineControls
    seo/       # JsonLd
  config/site.ts                       # Identité, URL, politiques commerciales (source unique)
  lib/
    catalog/   # types.ts, data.ts + demo-generator.ts (DÉMO : 100 produits/catégorie), repository.ts (seul accès aux données), search.ts (normalisation + pertinence, partagé serveur/navigateur), selectors.ts, pagination.ts
    cart/      # schema.ts (Zod + logique pure), pricing.ts, actions.ts (Server Actions), queries.ts, client.ts
    seo/       # metadata.ts (buildMetadata), jsonld.ts, og.tsx
    content/   # site-faq.ts, hero-slides.ts (diapositives du hero + vidéos)
    account/   # schema.ts (Zod : profil, adresses, téléphone +228), actions.ts (Server Actions), queries.ts
    auth/      # schema.ts (Zod + messages d'erreur), actions.ts (inscription, connexion, déconnexion, mot de passe, suppression), session.ts (getSessionUser, requireUser), redirect.ts (safeNextPath)
    supabase/  # server.ts (client serveur), proxy.ts (updateSession), database.types.ts (types générés)
    i18n/fr.ts # Textes d'interface
    utils/     # cn, format (prix en unité mineure de la devise, dates)
  styles/tokens.css                    # Design tokens (thème clair)
tests/                                 # Tests Vitest
supabase/migrations/                   # Migrations SQL appliquées au projet Supabase (source de vérité du schéma)
```

### Règles d'architecture

- Les pages et composants n'importent **jamais** `lib/catalog/data.ts` : uniquement `repository.ts`. Brancher PostgreSQL = réimplémenter `repository.ts` avec les mêmes signatures.
- Prix stockés en **entiers, dans l'unité mineure de la devise** (XOF : 1 = 1 F CFA, pas de centimes). Formatage uniquement via `formatPrice` / `toDecimal`, jamais de `/ 100` en dur.
- Métadonnées de page : toujours via `buildMetadata()`. JSON-LD : toujours via `lib/seo/jsonld.ts` + `<JsonLd />`.
- Aucune couleur en dur dans les composants : uniquement les tokens (`bg-surface`, `text-muted`, `text-accent`…).
- Le panier ne contient que SKU + quantité ; les montants sont recalculés côté serveur (`priceCart`). Stockage (`lib/cart/store.ts`) : visiteur → cookie `vx_cart` de l'appareil ; **client connecté → table `carts` du compte (source de vérité, identique sur tous ses appareils)**, le cookie n'en est que le reflet pour le compteur. À la connexion (mot de passe, inscription, lien e-mail) : `mergeCartIntoAccount` fusionne le panier de l'appareil dans celui du compte (même SKU → plus grande quantité, jamais d'addition). À la déconnexion / suppression du compte : le cookie est effacé (appareil partagé). Le compteur de l'en-tête récupère le panier du compte au chargement et au retour sur l'onglet, **uniquement si une vraie session existe** (aucun appel serveur pour un visiteur). Le panier ne se remplit **jamais** sans clic explicite sur « Ajouter au panier ».
- Les pages publiques restent statiques : rien dans le layout ne lit `cookies()` ou `headers()`.
- Next.js 16 : `params` est une Promise (`await params`), types `PageProps<"/route">` / `RouteContext`. Lire `node_modules/next/dist/docs/` avant d'utiliser une API inconnue.

---

## 5. Design system

### 5.1 Direction artistique

**« Boutique de confiance, chaleureuse et soignée. »** Mise en page inspirée des grandes boutiques e-commerce : bandeau de réassurance noir, recherche centrale, menu « Toutes les catégories », hero en grande carte arrondie, pastilles rondes de catégories, sélection produits dans un panneau blanc, encarts promo pastel, bande de conseil noire, pied de page noir. Palette inspirée des grandes boutiques high-tech : fond blanc / gris clair, noir pour les zones sombres, **bleu vif** pour les actions (boutons en pilule), **rouge** pour les remises et surtitres d'offre, **hero en dégradé corail → violet**, encarts pastel (lavande, beige, gris-bleu), vert réservé à l'état « en stock ». Typographie Poppins (titres et texte), specs techniques en micro-étiquettes mono.

À éviter absolument : carrousels automatiques, pop-ups agressifs, bannières clignotantes, fausses urgences (« plus que 2 h ! »), promotions ou avis inventés, look « marketplace discount » surchargé.

### 5.2 Tokens — source de vérité : `src/styles/tokens.css`

Couleurs principales (thème clair) :

| Token | Valeur | Usage |
|---|---|---|
| `--bg` / `--surface` / `--surface-2` | `#F5F6F8` / `#FFFFFF` / `#F1F3F6` | Fond gris clair, cartes, fonds de visuels |
| `--text` / `--text-muted` | `#14161A` / `#5B616C` | Texte |
| `--accent` / `--accent-strong` / `--accent-soft` | `#0B62C4` / `#094F9F` / `#E7F0FB` | Bleu vif : boutons, liens, actif |
| `--inverse` / `--on-inverse` / `--on-inverse-muted` | `#121316` / `#FFFFFF` / `#B3B8C1` | Noir : bandeau haut, pied de page, bande conseil, accueil du compte |
| `--hero-from` / `--hero-via` / `--hero-to` | `#D42A47` / `#A52D7C` / `#5523A8` | Dégradé du hero (texte blanc uniquement, ≥ 4,9:1 sur toute la hauteur) |
| `--tile-peach/sand/sky/rose/lilac` | pastels | Pastilles de catégories, hero, encarts promo |
| `--danger` | `#C41C28` | Remises : badge « -X % », prix remisé, surtitres d'offre (≥ 4,9:1 sur les tuiles) |
| `--signal` / `--warning` | `#1F7A46` / `#A35C00` | Stock disponible (vert conservé : code d'état universel) / stock faible |
| `--star` | `#F5A300` | Étoiles des avis (vérifiés uniquement) |

- Classes Tailwind correspondantes : `bg-accent`, `bg-inverse`, `text-on-inverse-muted`, `bg-tile-peach`, `text-danger`…
- Rayons : 6 / 10 / 16 / 24 px (`rounded-xl` pour les grandes cartes et sections).
- **Thème sombre : retiré pour l'instant.** Site en thème clair uniquement (`colorScheme: "light"`), même si l'appareil du visiteur est en mode sombre. Pas de sélecteur de thème. Les anciennes valeurs sombres et `ThemeToggle` sont dans l'historique git (commit `fc278d2`) en cas de réactivation.
- Tout contraste texte/fond respecte **WCAG AA** (vérifié pour toutes les paires ci-dessus en thème clair).

### 5.3 Typographie

**Police : Poppins** (auto-hébergée via `next/font/local` + `@fontsource/poppins`, `display: swap`, police de secours Arial aux métriques ajustées pour éviter le CLS), jeu « latin » (couvre le français : accents, « œ », « », espaces fines insécables). Une seule famille pour les titres et le texte, différenciés par la graisse et la taille.

| Graisse | Usage |
|---|---|
| 400 Regular | texte courant, descriptions |
| 500 Medium | navigation, libellés de champs, liens secondaires |
| 600 SemiBold | titres (h1–h3), boutons, noms de produits |
| 700 Bold | titre du hero, prix, logo |

JetBrains Mono (`font-mono`, chargée à la demande) reste réservée aux codes (SKU) et aux micro-étiquettes de caractéristiques. Budget : ~31 Ko de polices préchargées (4 fichiers Poppins de ~8 Ko). Ne pas ajouter d'autres graisses ni d'italique sans besoin réel.

**Échelle** (définie dans `globals.css`, `@theme`) — ne jamais inventer de taille arbitraire :

| Classe | Taille | Interlignage | Usage |
|---|---|---|---|
| `text-display` | 30 → 52 px (fluide) | 1,12 | titre de diapositive du hero (Bold) |
| `text-h1` | 28 → 40 px | 1,15 | titre de page (un seul `h1`) |
| `text-h2` | 22 → 30 px | 1,25 | titre de section |
| `text-h3` | 18 → 20 px | 1,35 | sous-section, carte, titre de bloc |
| `text-lg` / `text-base` | 18 / 16 px | 1,6 / 1,65 | chapô / texte courant |
| `text-sm` | 14 px | 1,5 | texte secondaire, tableaux, navigation, boutons |
| `text-xs` / `.eyebrow` | 12 px | 1,45 | métadonnées, surtitres en capitales (interlettrage 0,08 em) |

**Règles :**
- Texte courant **16 px minimum**, interlignage 1,6. **Rien sous 12 px** (seule exception : le chiffre du compteur panier, 11 px, doublé d'un `aria-label`).
- Champs de formulaire en **16 px minimum** (sinon iOS zoome au focus).
- Capitales uniquement via `.eyebrow` (12 px, interlettrage 0,08 em : Poppins est déjà large) ; jamais d'interlettrage > 0,12 em.
- Poppins est large : textes d'aide et libellés courts sur mobile (vérifier qu'ils tiennent à 375 px).
- Longueur de ligne : `.measure` (60ch ≈ 70 caractères) sur tout paragraphe long.
- Titres : `text-wrap: balance` ; paragraphes : `text-wrap: pretty` (pas de mot isolé).
- Valeurs de tableaux en Poppins (`font-medium`) ; la monospace est réservée aux codes et aux puces de specs courtes.
- **Typographie française** : passer les textes éditoriaux par `frenchSpacing()` (`lib/utils/typography.ts`) — espace fine insécable avant `? ! ;`, insécable avant `:` et dans `« »`.

### 5.4 Composants clés

- **En-tête :** bandeau de réassurance (`bg-inverse`) → logo + `SearchForm` (GET `/recherche`, fonctionne sans JS ; avec JS, suggestions instantanées en combobox ARIA dès 2 caractères : catégories, 6 produits, « Voir tous les résultats » ; index `/api/suggestions` chargé une fois au focus puis filtré localement, mêmes règles que `/recherche` via `lib/catalog/search.ts` — insensible aux accents, synonymes « téléphone », « pc »… dans `CATEGORY_SYNONYMS`) + panier → navigation avec `CategoryMenu` (`<details>`, refermé à la navigation) et `NavLink` (onglet actif souligné ; chaque lien porte une icône décorative — maison, téléphone, ordinateur, aide — à côté de son libellé, toujours affiché ; icône bleue sur la rubrique active).
- **Hero immersif (`components/home/hero/`) :** deux diapositives par catégorie (4 au total) (`lib/content/hero-slides.ts`), liée à un produit réel ; textes marketing fidèles à la fiche. Grand écran : média à droite, dégradé `inverse` à gauche sous le texte. Petit écran : média plein cadre, texte superposé en bas. Navigation volontaire uniquement : chevrons pleins épais, onglets, flèches du clavier, glissement tactile — **jamais de défilement automatique**. `video` (mp4/webm + poster) lue si fournie, sinon scène animée vectorielle (`HeroScene`). Seul `h1` de l'accueil : l'intitulé fixe en haut du hero.
- **Accueil (`components/home/`) :** `HeroShowcase`, `CategoryCircles`, sélection en `ProductGrid`, `PromoTiles`, `ReviewsSection`, `HelpBand`, FAQ, `TrustBar`.
- **ProductCard :** visuel sur fond `surface-2`, badge « -X % » si remise réelle, marque, nom, 2–3 specs en micro-étiquettes mono, prix (corail si remisé), état du stock (point + texte), bouton rond `QuickAddButton` (ajoute la variante par défaut, posé au-dessus du lien étiré).
- **En-tête de catégorie (`CategoryHeader`) :** sur petit écran, seul le `h1` reste visible (bandeau, chiffres, introduction et illustration masqués ; l'introduction reste dans le HTML). À partir de 640 px : bandeau à la teinte de la catégorie (`categoryTile`, identique à sa pastille d'accueil), date de mise à jour (`<time>`), chiffres clés en `<dl>` (prix d'entrée, disponibles, marques, livraison — tous calculés, jamais saisis), illustration de deux produits réels, raccourcis « par marque » vers `/recherche?q=…&categorie=…` (`rel="nofollow"`, page `noindex`). Liste : `h2` « N références » puis cartes en `h3`.
- **Espace client (`/compte`, `components/account/`) :** réservé aux clients connectés (`requireUser` → `/connexion?suite=/compte`). Rassemble profil (prénom, nom, téléphone +228 ; e-mail du compte en lecture seule), adresses de livraison (quartier, ville, point de repère, téléphone, adresse par défaut ; 10 max), commandes (vide tant que le paiement n'est pas branché), panier, modification du mot de passe, déconnexion et **suppression définitive du compte**. Données dans Supabase (tables `profiles`, `addresses`), lues/écrites par Server Actions validées par Zod, protégées par RLS.
- **Parcours d'achat (principe : le plus simple possible) :** navigation, recherche et panier **sans compte** (panier en cookie). L'identification n'est demandée qu'au clic sur « Valider mon panier » : `/commande` redirige vers `/connexion?suite=/commande`, écran « Plus qu'une étape » avec deux choix (« J'ai déjà un compte » / « Je suis nouveau client »), panier conservé, retour automatique à la commande (y compris via le lien d'activation e-mail). Repère `CheckoutSteps` : Panier → Identification → Livraison et paiement. `/commande` : choix de l'adresse en un toucher ou ajout sur place, récapitulatif recalculé côté serveur ; paiement affiché « bientôt disponible » (pas de prestataire, pas de tests E2E).
- **Authentification (`/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`) :** e-mail + mot de passe (8 caractères min.), messages d'erreur en français qui ne révèlent jamais si une adresse a un compte, retour après connexion limité aux chemins internes (`safeNextPath`), liens e-mail via `/auth/callback` (PKCE). Toutes `noindex`.
- **Avis (`ReviewsSection`) :** n'affiche RIEN tant que `getVerifiedReviews()` est vide. Jamais d'avis d'exemple.
- **Newsletter :** remplacée par `HelpBand` tant qu'aucun service d'e-mailing n'est branché (pas de formulaire factice).
- **Fiche produit :** galerie à gauche, bloc d'achat collant à droite (prix, variantes, stock, délai de livraison, garantie, CTA), puis description, **tableau de caractéristiques**, contenu de la boîte, FAQ, avis.
- **SpecTable :** tableau sémantique `<table>` (pas de `div`), groupé par catégorie, unités systématiques.
- **Filtres de catégorie (à venir) :** facettes par specs réelles. Les URL de filtres combinés sont `noindex` sauf combinaisons stratégiques définies.

### 5.5 Mouvement

Animations courtes (150–250 ms), `ease-out`, uniquement fonctionnelles (feedback, transitions d'état). Respect de `prefers-reduced-motion`.

**Exception : le hero de l'accueil.** Ses scènes animées en boucle (flottement, rotation 3D, lueurs, particules) et ses vidéos sont voulues pour un rendu immersif. Elles n'utilisent que `transform`/`opacity`, sont mises en pause sur les diapositives inactives et entièrement coupées avec `prefers-reduced-motion` (vidéo non lue, poster affiché).

### 5.6 Responsive — mobile concis

Mobile first. Points de rupture : 640 / 768 / 1024 / 1280 / 1536. Le CTA « Ajouter au panier » reste accessible en permanence sur mobile (barre basse collante).

Objectif : une page doit rester **courte sur mobile** (accueil ≈ 4 écrans, catégorie ≈ 7, fiche ≈ 5 à 375 px). Règles :
- Grilles produit en **2 colonnes** dès 320 px (`ProductGrid`), carte compacte : 1 seule caractéristique, nom sur 2 lignes max, bouton d'ajout dans le coin de l'image.
- Aperçus courts (sélection, produits similaires, catégories, encarts) en **rangée défilante** (`layout="rail"`, `snap-x`) sur mobile, grille à partir de 640 px. La carte suivante dépasse pour inviter au glissement.
- Textes d'accompagnement masqués ou limités (`line-clamp`) sur mobile ; jamais le titre, le prix ni l'action principale.
- Pied de page en **accordéons** sous 768 px.
- Aucun débordement horizontal de page (seules les rangées défilent).

---

## 6. SEO — règles obligatoires

### 6.1 URL et structure

- URL courtes, en minuscules, avec tirets, sans paramètres pour le contenu indexable : `/categorie/nom-produit-variante-cle`.
- Une seule URL canonique par produit ; les variantes (couleur, capacité) pointent vers la canonique sauf si elles ont un volume de recherche propre.
- Maillage interne : fil d'Ariane sur toutes les pages et tous les écrans, liens catégorie ↔ produits ↔ marques, « produits similaires » et « accessoires compatibles ».
- Profondeur maximale : tout produit accessible en 3 clics depuis l'accueil.

### 6.2 Métadonnées (via `generateMetadata`)

Chaque page indexable définit :
- `title` unique (≤ 60 caractères) : `{Produit} {spec clé} – {Marque du site}`
- `description` unique (≤ 155 caractères) avec bénéfice + prix/disponibilité si pertinent
- `alternates.canonical`
- Open Graph + Twitter Card (image OG dynamique produit)
- `hreflang` si le site devient multilingue
- Un seul `<h1>` par page, hiérarchie `h2`/`h3` logique

Pages `noindex` : panier, commande, compte (`/compte`), connexion, inscription, mots de passe, recherche interne, filtres non stratégiques, admin.

### 6.3 Données structurées (JSON-LD)

Générées par `src/lib/seo/` et injectées via le composant `<JsonLd />`. Toujours cohérentes avec le contenu visible.

| Page | Schémas |
|---|---|
| Toutes | `Organization` (logo, contacts, réseaux), `WebSite` + `SearchAction` |
| Fiche produit | `Product` (name, brand, sku, gtin/mpn, image, description, `additionalProperty` pour les specs), `Offer` (price, priceCurrency, availability, itemCondition, shippingDetails, hasMerchantReturnPolicy), `AggregateRating` + `Review` (avis réels uniquement), `BreadcrumbList` |
| Catégorie | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| FAQ | `FAQPage` |

Valider chaque gabarit avec le test des résultats enrichis de Google et le validateur schema.org.

### 6.4 Fichiers techniques

- `sitemap.ts` : sitemap index + sitemaps séparés (produits, catégories, marques) avec `lastmod` réel.
- `robots.ts` : autorise l'indexation du contenu public, bloque `/panier`, `/commande`, `/compte`, les pages d'authentification, `/auth/`, `/admin`, `/api`, la recherche interne ; référence le sitemap.
- Flux produits XML pour Google Merchant Center et Bing Merchant Center.
- Gestion des redirections 301 lorsqu'un slug change ; produits retirés → 301 vers la catégorie ou un successeur, jamais de 404 en masse.
- Produits en rupture : la page reste en ligne, `availability: OutOfStock`, alternatives proposées.

### 6.5 Performance (Core Web Vitals)

Objectifs en production (mobile) : **LCP < 2,5 s, INP < 200 ms, CLS < 0,1**, score Lighthouse ≥ 95 en Performance, SEO et Accessibilité.

- Image principale produit en `priority`, dimensions toujours déclarées.
- Pas de bibliothèque JS lourde côté client sans justification ; privilégier les Server Components.
- Scripts tiers chargés en `lazyOnload` et limités au strict nécessaire.

---

## 7. Visibilité dans les assistants IA (GEO)

Les assistants IA citent les sources claires, factuelles, structurées et à jour. Règles :

1. **Accès des robots IA** dans `robots.ts` : autoriser explicitement `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-User`, `Claude-SearchBot`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `Bingbot` sur le contenu public. Ne jamais bloquer ces robots par erreur via un pare-feu ou un mode anti-bot.
2. **Rendu sans JavaScript** : vérifier régulièrement qu'un `curl` de chaque gabarit renvoie le contenu complet (nom, prix, specs, description, FAQ).
3. **`/llms.txt`** : fichier Markdown généré dynamiquement présentant la boutique (qui, quoi, où, politique de livraison/retour/garantie) et listant les pages clés (catégories, FAQ, contact) avec une phrase de description chacune. Optionnellement `/llms-full.txt`.
4. **Contenu « citable »** :
   - Chaque fiche produit commence par un résumé factuel de 2–3 phrases (ce que c'est, pour qui, point fort).
   - Specs en tableau HTML avec unités ; pas de specs uniquement dans des images.
   - Section **FAQ** par produit et par catégorie, formulée comme les vraies questions des acheteurs (« Ce téléphone est-il compatible 5G ? », « Quelle autonomie réelle ? »).
   - **Guides d'achat** : rubrique **supprimée** à la demande du client (octobre 2026). Les anciennes URL `/guides/*` redirigent en 308 vers l'accueil. À reconsidérer plus tard : c'est un levier important de visibilité dans les assistants IA.
   - Informations de confiance faciles à trouver : mentions légales, adresse/contact, délais et coûts de livraison, politique de retour, garantie.
5. **Fraîcheur** : prix, stock et dates de mise à jour exacts ; un assistant ne doit jamais citer une information périmée.
6. **Cohérence d'entité** : même nom de marque, logo, coordonnées et description partout (site, schema `Organization`, réseaux sociaux, annuaires, Google Business Profile si applicable).
7. **Pas de contenu généré en masse sans relecture** : chaque description est unique, exacte et utile. Ne jamais copier les descriptions des fabricants mot pour mot.

---

## 8. Accessibilité

- Conformité **WCAG 2.2 AA**.
- Navigation complète au clavier, focus visible et stylé.
- `alt` descriptifs sur toutes les images produit (« Smartphone X noir, vue de face »), `alt=""` pour les images décoratives.
- Libellés sur tous les champs de formulaire, messages d'erreur reliés aux champs.
- Contrastes vérifiés (thème clair ; à refaire si le thème sombre est réactivé).

---

## 9. Sécurité et conformité

- Aucun secret dans le code : variables d'environnement uniquement (`.env.local`, jamais commité). Tenir `.env.example` à jour.
- Paiement : jamais de données de carte stockées ni transitant par nos serveurs ; utiliser les pages/composants hébergés du prestataire.
- Validation de toutes les entrées côté serveur (Zod). Prix et totaux **toujours recalculés côté serveur**.
- Politique de sécurité de contenu (CSP), en-têtes de sécurité, protection CSRF sur les mutations, limitation de débit sur les API publiques.
- Conformité à la législation applicable sur les données personnelles (RGPD / loi locale) : consentement pour les traceurs non essentiels, page de politique de confidentialité, droit d'accès/suppression.
- Pages légales obligatoires : mentions légales, CGV, politique de retour, confidentialité, cookies.
- **Comptes clients (Supabase)** : seule la clé *publishable* (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) est utilisée ; **jamais** la clé *secret* / service_role dans le code. La sécurité des données repose sur la **RLS** (chaque client ne lit/écrit que ses lignes) + validation Zod côté serveur. Session vérifiée par `getClaims()` (jamais `getSession()` côté serveur). `delete_my_account()` est volontairement `SECURITY DEFINER` (avertissement Supabase accepté) : elle ne supprime que `auth.uid()`. Après toute migration : régénérer `database.types.ts` et relancer l'analyse de sécurité Supabase.

---

## 10. Conventions de code

- TypeScript `strict`, pas de `any` sans commentaire justificatif.
- Server Components par défaut ; `"use client"` uniquement pour l'interactivité.
- Noms de fichiers de composants en `PascalCase.tsx`, utilitaires en `camelCase.ts`.
- Textes de l'interface centralisés (prêts pour l'i18n), en français par défaut.
- Monnaie et formats via `Intl.NumberFormat` / `Intl.DateTimeFormat` ; devise définie par `NEXT_PUBLIC_CURRENCY`.
- Commits au format Conventional Commits (`feat:`, `fix:`, `seo:`, `design:`…).
- Petites PR ciblées, une fonctionnalité à la fois.

---

## 11. Modèle de données (résumé)

`Product` (id, slug, nom, marque, catégorie, résumé, description, specs JSON typées, gtin, mpn, statut, dates) → `Variant` (sku, attributs, prix, prix barré, stock, images) → `Category` (arborescence, slug, contenu SEO, FAQ) → `Brand` → `Review` (vérifié, note, texte, date) → `Order` / `OrderItem` / `Customer` / `Address`.

Toute modification du schéma passe par une migration, enregistrée dans `supabase/migrations/`.

---

## 12. Définition de « terminé »

Une tâche est terminée seulement si :

- [ ] `lint`, `typecheck` et tests passent
- [ ] Rendu correct mobile + desktop
- [ ] Pour toute page indexable : métadonnées, canonical, JSON-LD valides, h1 unique
- [ ] Contenu visible sans JavaScript (vérifié au `curl`)
- [ ] Pas de régression Lighthouse (≥ 95 Perf/SEO/A11y)
- [ ] Sitemap et `llms.txt` à jour si de nouvelles pages publiques sont créées
- [ ] Aucun secret ni donnée personnelle exposés

---

## 13. Ce que Claude ne doit pas faire

- Ajouter une dépendance lourde sans l'expliquer et demander validation.
- Inventer des caractéristiques techniques, des avis ou des notes : les données produit proviennent uniquement de la base.
- Masquer du contenu aux utilisateurs tout en le montrant aux robots (cloaking).
- Modifier les règles de `robots.ts`, les redirections ou les canoniques sans le signaler explicitement.
- Toucher au tunnel de paiement sans tests E2E associés.

---

## 14. Paramètres à compléter

```
NOM_BOUTIQUE=ElectroMarket
DOMAINE=
PAYS_DE_VENTE=TG            # Togo — lancement à Lomé
LOCALE=fr-TG
NEXT_PUBLIC_CURRENCY=XOF    # franc CFA, 0 décimale
LANGUES=fr
PAYMENT_PROVIDER=
TRANSPORTEURS=
```

Valeurs centralisées dans `src/config/site.ts`.

**Déploiement :** Vercel, projet `electro-market` (espace « Hubert's projects »), relié au dépôt GitHub `Msskoff/electro-market`. Chaque push sur `main` = déploiement de production. Démo client : https://electro-market-one.vercel.app — non indexée tant que `SITE_INDEXING` n'est pas `true` (à n'activer qu'au lancement réel, avec le vrai catalogue).

**Catalogue de démonstration :** 2 catégories (smartphones, ordinateurs portables) ; 4 fiches rédigées + 196 produits générés par `demo-generator.ts` (déterministe, URL stables), soit 100 par catégorie. Tout est fictif et signalé par le bandeau « Démo » : à remplacer par la base réelle avant lancement. Marquées « À VALIDER » : frais de livraison (2 000 F CFA), seuil de gratuité (50 000 F CFA), délai (24–48 h à Lomé), retours (30 j), garantie (2 ans), adresse et téléphone.

**Mode sombre :** retiré pour l'instant (thème clair uniquement).

Mettre à jour ce fichier dès que ces décisions sont prises.


---

@AGENTS.md
