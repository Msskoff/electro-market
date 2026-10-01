import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

interface PriceProps {
  /** Montant dans l'unité mineure de la devise. */
  amount: number;
  /** Prix de référence barré, même unité. */
  compareAt?: number;
  size?: "sm" | "md" | "lg";
  /** Préfixe (« à partir de ») quand plusieurs variantes ont des prix différents. */
  prefix?: string;
  className?: string;
}

const sizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

export function Price({ amount, compareAt, size = "md", prefix, className }: PriceProps) {
  const discounted = compareAt !== undefined && compareAt > amount;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      {prefix && <span className="text-sm text-muted">{prefix}</span>}
      <span
        className={cn(
          "font-bold tabular tracking-tight",
          sizes[size],
          discounted && "text-danger",
        )}
      >
        {formatPrice(amount)}
      </span>
      {discounted && (
        <s className="text-sm text-muted tabular">
          <span className="sr-only">Prix de référence : </span>
          {formatPrice(compareAt)}
        </s>
      )}
    </p>
  );
}
