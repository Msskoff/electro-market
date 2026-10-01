import { stockState } from "@/lib/catalog/types";
import { t } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils/cn";

const styles = {
  in_stock: { dot: "bg-signal", text: "text-signal" },
  low_stock: { dot: "bg-warning", text: "text-warning" },
  out_of_stock: { dot: "bg-danger", text: "text-danger" },
} as const;

/** État du stock : point coloré + texte (jamais la couleur seule). */
export function StockStatus({ stock, className }: { stock: number; className?: string }) {
  const state = stockState(stock);
  const label =
    state === "in_stock"
      ? t.product.inStock
      : state === "low_stock"
        ? t.product.lowStock(stock)
        : t.product.outOfStock;

  return (
    <p className={cn("flex items-center gap-2 text-sm font-medium", styles[state].text, className)}>
      <span aria-hidden className={cn("size-2 rounded-full", styles[state].dot)} />
      {label}
    </p>
  );
}
