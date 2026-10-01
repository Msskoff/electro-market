import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils/cn";

type ContainerProps<T extends ElementType> = {
  as?: T;
} & ComponentPropsWithoutRef<T>;

/** Conteneur centré avec gouttières responsives (16 px sur mobile). */
export function Container<T extends ElementType = "div">({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
