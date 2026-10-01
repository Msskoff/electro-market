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
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 rounded-xl border border-border bg-surface p-4 sm:gap-6 sm:p-6 lg:grid-cols-4 lg:gap-4 lg:p-8">
      {trustItems.map((item) => (
        <li key={item.title} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent sm:size-12">
            <Icon name={item.icon} size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold sm:text-base">{item.title}</p>
            <p className="text-xs text-muted sm:text-sm">{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
