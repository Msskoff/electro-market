import type { IconName } from "@/components/ui/Icon";
import type { DeviceKind } from "@/lib/catalog/types";

/** Pictogramme associé à chaque type d'appareil (menu, pastilles de catégories). */
export const kindIcon: Record<DeviceKind, IconName> = {
  phone: "phone",
  laptop: "laptop",
  headphones: "headphones",
  earbuds: "headphones",
  tablet: "tablet",
  watch: "watch",
};
