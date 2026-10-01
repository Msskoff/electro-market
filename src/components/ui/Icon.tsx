import type { SVGProps } from "react";

/**
 * Jeu d'icônes minimal en trait 1,5 px.
 * Toujours décoratives (aria-hidden) : le sens est porté par le texte voisin.
 */
const paths = {
  cart: "M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  truck: "M3 6h11v9H3zM14 9h4l3 3v3h-7M7.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  shield: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4",
  rotate: "M4 12a8 8 0 0 1 13.66-5.66L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.66 5.66L4 15.5M4 20v-4.5h4.5",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  check: "m5 12 5 5 9-10",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4.35-4.35",
  menu: "M4 6h16M4 12h16M4 18h16",
  chevronDown: "m6 9 6 6 6-6",
  chevronRight: "m9 6 6 6-6 6",
  sparkle: "M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.5 2.5m6.4 6.4 2.5 2.5m0-11.4-2.5 2.5m-6.4 6.4-2.5 2.5",
  tag: "M3 12V4h8l9 9-8 8-9-9Zm4.5-4.5h.01",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-3.5-1L7 21l5-2.5L17 21l-1.5-7",
  chat: "M4 5h16v11H8l-4 4V5Zm4 5h.01M12 10h.01M16 10h.01",
  phone: "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm3 17h2",
  laptop: "M5 5h14v10H5zM2 19h20",
  headphones: "M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H5a1 1 0 0 1-1-1v-4Zm16 0h-3v5h2a1 1 0 0 0 1-1v-4Z",
  tablet: "M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm5 17h2",
  watch: "M9 3h6l1 4H8l1-4Zm-1 14h8l-1 4H9l-1-4Zm-1-10h10v10H7z",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 16a2 2 0 0 1 2-2h13v2",
  mail: "M3 5h18v14H3zm0 0 9 7 9-7",
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
