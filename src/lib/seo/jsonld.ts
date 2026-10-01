import { absoluteUrl, siteConfig } from "@/config/site";
import { productImagePath, productPath } from "@/lib/catalog/selectors";
import type { Brand, Category, FaqItem, Product } from "@/lib/catalog/types";
import { toDecimal } from "@/lib/utils/format";

/**
 * Générateurs de données structurées schema.org (JSON-LD).
 * Règle : chaque valeur doit correspondre à ce qui est VISIBLE sur la page.
 */

type JsonLd = Record<string, unknown>;

const ORG_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": ORG_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.svg"),
    description: siteConfig.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address.street,
      addressLocality: siteConfig.contact.address.city,
      addressRegion: siteConfig.contact.address.region,
      addressCountry: siteConfig.contact.address.country,
    },
    sameAs: siteConfig.social,
    hasMerchantReturnPolicy: returnPolicy(),
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

function returnPolicy(): JsonLd {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: siteConfig.contact.address.country,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: siteConfig.policies.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  };
}

function shippingDetails(price: number): JsonLd {
  const free = price >= siteConfig.policies.freeShippingThreshold;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: toDecimal(free ? 0 : siteConfig.policies.shippingCost),
      currency: siteConfig.currency,
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: siteConfig.contact.address.country,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: siteConfig.policies.shippingDays.min,
        maxValue: siteConfig.policies.shippingDays.max,
        unitCode: "DAY",
      },
    },
  };
}

export function productJsonLd(product: Product, brand: Brand, category: Category): JsonLd {
  const url = absoluteUrl(productPath(product));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.summary,
    url,
    image: [absoluteUrl(productImagePath(product))],
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
      shippingDetails: shippingDetails(v.price),
      hasMerchantReturnPolicy: returnPolicy(),
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
