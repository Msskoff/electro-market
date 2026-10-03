import { absoluteUrl, siteConfig } from "@/config/site";
import { primaryImage, productImagePath, productPath } from "@/lib/catalog/selectors";
import type { Brand, Category, FaqItem, Product } from "@/lib/catalog/types";
import type { StoreSettings } from "@/lib/settings/types";
import { toDecimal } from "@/lib/utils/format";

/**
 * Générateurs de données structurées schema.org (JSON-LD).
 * Règle : chaque valeur doit correspondre à ce qui est VISIBLE sur la page.
 */

type JsonLd = Record<string, unknown>;

/** Valeurs de configuration (modifiables dans /admin) reprises dans les données structurées. */
type StoreInfo = Pick<StoreSettings, "contact" | "policies" | "social">;

const ORG_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

export function organizationJsonLd(store: StoreInfo): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": ORG_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    // PNG carré 512 px sur fond blanc : format recommandé par Google pour le logo d'entreprise.
    logo: absoluteUrl("/logo.png"),
    description: siteConfig.description,
    email: store.contact.email,
    telephone: store.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.contact.address.street,
      addressLocality: store.contact.address.city,
      addressRegion: store.contact.address.region,
      addressCountry: store.contact.address.country,
    },
    sameAs: store.social,
    hasMerchantReturnPolicy: returnPolicy(store),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    name: siteConfig.name,
    inLanguage: siteConfig.language,
    publisher: { "@id": ORG_ID },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

function returnPolicy(store: StoreInfo): JsonLd {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: store.contact.address.country,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: store.policies.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  };
}

function shippingDetails(store: StoreInfo, price: number): JsonLd {
  const free = price >= store.policies.freeShippingThreshold;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: toDecimal(free ? 0 : store.policies.shippingCost),
      currency: siteConfig.currency,
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: store.contact.address.country,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: store.policies.shippingDays.min,
        maxValue: store.policies.shippingDays.max,
        unitCode: "DAY",
      },
    },
  };
}

export function productJsonLd(product: Product, brand: Brand, category: Category, store: StoreInfo): JsonLd {
  const url = absoluteUrl(productPath(product));
  // Vraies photos (une par variante, sans doublon) puis le visuel généré, toujours disponible.
  const photos = [...new Set(product.variants.map((v) => primaryImage(product, v)?.src).filter((s): s is string => !!s))];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.summary,
    url,
    image: [...photos.map((src) => (src.startsWith("http") ? src : absoluteUrl(src))), absoluteUrl(productImagePath(product))],
    brand: { "@type": "Brand", name: brand.name },
    category: category.name,
    ...(product.mpn ? { mpn: product.mpn } : {}),
    sku: product.variants[0]?.sku,
    additionalProperty: product.specs.flatMap((group) =>
      group.specs.map((s) => ({
        "@type": "PropertyValue",
        name: `${group.label} – ${s.label}`,
        value: s.value,
      })),
    ),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      ...(v.gtin ? { gtin13: v.gtin } : {}),
      name: `${product.name} ${v.label}`,
      url,
      price: toDecimal(v.price),
      priceCurrency: siteConfig.currency,
      availability:
        v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
      shippingDetails: shippingDetails(store, v.price),
      hasMerchantReturnPolicy: returnPolicy(store),
    })),
  };
}

/** `offset` : rang du premier produit (pages de catégorie paginées). */
export function itemListJsonLd(name: string, products: Product[], offset = 0): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: offset + i + 1,
      url: absoluteUrl(productPath(p)),
      name: p.name,
    })),
  };
}

export function faqJsonLd(items: FaqItem[]): JsonLd | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    inLanguage: siteConfig.language,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt,
    author: { "@type": "Person", name: input.author },
    publisher: { "@id": ORG_ID },
  };
}
