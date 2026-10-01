import { Icon, type IconName } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils/format";

const { policies } = siteConfig;

export const trustItems: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "truck",
    title: `Livraison ${policies.shippingDelay}`,
    text: `Offerte dès ${formatPrice(policies.freeShippingThreshold)}`,
  },
  {
    icon: "rotate",
    title: `${policies.returnDays} jours pour changer d'avis`,
    text: "Retour gratuit",
  },
  {
    icon: "shield",
    title: `Garantie ${policies.warrantyYears} ans`,
    text: "Produits neufs, scellés",
  },
  {
    icon: "lock",
    title: "Paiement sécurisé",
    text: "Données bancaires jamais stockées",
  },
];

/** Bandeau de réassurance — engagements vérifiables uniquement. */
export function TrustBar() {
  return (
    <ul className="grid grid-cols-1 gap-6 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:p-8">
      {trustItems.map((item) => (
        <li key={item.title} className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon name={item.icon} size={22} />
          </span>
          <div>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted">{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
