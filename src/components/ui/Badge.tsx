import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "accent" | "signal" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  signal: "bg-signal-soft text-signal",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Micro-étiquette de caractéristique (« 6,4" OLED 120 Hz »). */
export function SpecChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs leading-5 text-muted">
      {children}
    </span>
  );
}
