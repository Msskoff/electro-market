import { siteConfig } from "@/config/site";
import type { FaqItem } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/utils/format";

const { policies } = siteConfig;

/** FAQ générale : livraison, retours, garantie, paiement. Réutilisée par /faq, l'accueil et /llms.txt. */
export const siteFaq: FaqItem[] = [
  {
    question: "Quels sont les délais et frais de livraison ?",
    answer: `La livraison prend ${policies.shippingDelay}. Elle coûte ${formatPrice(policies.shippingCost)} et devient offerte dès ${formatPrice(policies.freeShippingThreshold)} d'achat.`,
  },
  {
    question: "Puis-je retourner un produit ?",
    answer: `Oui, vous disposez de ${policies.returnDays} jours après réception pour retourner un produit, sans avoir à vous justifier. Le retour est gratuit.`,
  },
  {
    question: "Quelle garantie s'applique à mes achats ?",
    answer: `Tous les produits sont neufs et bénéficient d'une garantie de ${policies.warrantyYears} ans.`,
  },
  {
    question: "Les produits sont-ils neufs ?",
    answer: "Oui, tous les produits vendus sont neufs, dans leur emballage d'origine scellé.",
  },
];
