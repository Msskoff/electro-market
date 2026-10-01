"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Container } from "@/components/ui/Container";
import type { DeviceKind } from "@/lib/catalog/types";
import type { HeroSlide } from "@/lib/content/hero-slides";
import { cn } from "@/lib/utils/cn";
import { HeroScene } from "./HeroScene";
import { frenchSpacing } from "@/lib/utils/typography";

export interface ShowcaseSlide extends HeroSlide {
  categoryName: string;
  categoryHref: string;
  productName: string;
  productHref: string;
  /** Libellé de CTA avec article (« l'Aurion One 5G », « le Nuvia Book 14 Air »). */
  productCta: string;
  kind: DeviceKind;
  color: string;
  priceLabel: string;
  discount: number;
}

/** Chevron plein et épais (forme pleine, pas un trait). */
function BoldChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden focusable="false" className={direction === "left" ? "-scale-x-100" : undefined}>
      <path d="M8.1 2.4 17.7 12l-9.6 9.6-3.6-3.6 6-6-6-6z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronButton({ direction, label, onClick }: { direction: "left" | "right"; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex size-14 items-center justify-center rounded-full bg-on-inverse text-inverse shadow-[0_12px_30px_-8px_rgb(0_0_0_/_0.6)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-on-inverse lg:size-16"
    >
      <BoldChevron direction={direction} />
    </button>
  );
}

/**
 * Hero immersif de l'accueil : une diapositive par catégorie.
 * Navigation volontaire uniquement (chevrons, onglets, flèches du clavier, glissement) :
 * aucun défilement automatique. Toutes les diapositives sont rendues côté serveur.
 */
export function HeroShowcase({ slides }: { slides: ShowcaseSlide[] }) {
  const [index, setIndex] = useState(0);
  const [announce, setAnnounce] = useState("");
  const interacted = useRef(false);
  const pointerStart = useRef<number | null>(null);
  const count = slides.length;

  /** Mise à jour fonctionnelle : fiable même en cas de clics rapides. */
  const step = (delta: number) => {
    interacted.current = true;
    setIndex((i) => (i + delta + count) % count);
  };
  const goTo = (i: number) => {
    interacted.current = true;
    setIndex(i);
  };

  useEffect(() => {
    if (interacted.current) setAnnounce(`Diapositive ${index + 1} sur ${count} : ${slides[index].categoryName}`);
  }, [index, count, slides]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType !== "mouse") pointerStart.current = e.clientX;
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerStart.current === null) return;
    const dx = e.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="À la une"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (pointerStart.current = null)}
      className="relative isolate h-[540px] touch-pan-y overflow-hidden bg-inverse text-on-inverse sm:h-[700px] lg:h-[clamp(600px,calc(100svh-11rem),740px)]"
    >
      {slides.map((s, i) => {
        const active = i === index;
        return (
          <div
            key={s.productSlug}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${i + 1} sur ${count} : ${s.categoryName}`}
            aria-hidden={!active}
            inert={!active}
            data-active={active}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
            )}
          >
            <HeroScene kind={s.kind} color={s.color} tone={s.tone} video={s.video} active={active} />

            {/* Grand écran : dégradé à gauche, sous le texte. Petit écran : dégradé par le bas. */}
            <div className="absolute inset-y-0 left-0 hidden w-[64%] bg-gradient-to-r from-inverse from-30% via-inverse/80 to-transparent lg:block" />
            <div className="absolute inset-x-0 bottom-0 h-[66%] bg-gradient-to-t from-inverse from-45% via-inverse/80 to-transparent lg:hidden" />

            <Container className="relative flex h-full flex-col justify-end pb-28 sm:pb-36 lg:justify-center lg:pb-10">
              <div className="hero-content max-w-xl">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="eyebrow rounded-full border border-on-inverse/25 px-3 py-1 text-on-inverse-muted">
                    {s.categoryName}
                  </span>
                  {s.discount > 0 && (
                    <span className="rounded-full bg-danger px-3 py-1 text-xs font-bold text-on-accent tabular">-{s.discount} %</span>
                  )}
                </p>
                <h2 className="mt-3 text-display text-on-inverse sm:mt-5">{frenchSpacing(s.title)}</h2>
                <p className="mt-5 hidden max-w-lg leading-relaxed text-on-inverse-muted sm:block lg:text-lg">{frenchSpacing(s.text)}</p>
                <p className="mt-4 text-xs sm:mt-6 sm:text-sm">
                  <span className="font-semibold text-on-inverse">{s.productName}</span>
                  <span className="mx-2 text-on-inverse-muted">·</span>
                  <span className="text-on-inverse-muted">{s.priceLabel}</span>
                </p>
                <div className="mt-5 flex flex-wrap gap-3 sm:mt-7">
                  <Link
                    href={s.productHref}
                    className="inline-flex h-11 items-center rounded-full bg-on-inverse px-5 text-sm sm:h-12 sm:px-6 font-semibold text-inverse transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-on-inverse"
                  >
                    Découvrir {s.productCta}
                  </Link>
                  <Link
                    href={s.categoryHref}
                    className="hidden h-12 items-center rounded-full border border-on-inverse/35 px-6 sm:inline-flex text-sm font-semibold transition-colors hover:bg-on-inverse/10 focus-visible:outline-on-inverse"
                  >
                    Voir la catégorie {s.categoryName}
                  </Link>
                </div>
              </div>
            </Container>
          </div>
        );
      })}

      {/* Intitulé fixe de la page (seul h1) */}
      <Container className="pointer-events-none absolute inset-x-0 top-0 z-20 pt-6 lg:pt-8">
        <h1 className="eyebrow truncate font-sans text-on-inverse-muted">
          ElectroMarket · Boutique d&apos;électronique à Lomé
        </h1>
      </Container>

      {/* Commandes */}
      <Container className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 pb-6 lg:pb-8">
        <div className="min-w-0 flex-1">
          <p className="mb-3 font-mono text-xs tabular text-on-inverse-muted lg:hidden">
            <span className="text-on-inverse">{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
          </p>
          <ol className="flex max-w-2xl gap-2 lg:gap-4">
            {slides.map((s, i) => (
              <li key={s.productSlug} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Diapositive ${i + 1} : ${s.categoryName}`}
                  aria-current={i === index ? "true" : undefined}
                  className="group block w-full py-2 text-left focus-visible:outline-on-inverse"
                >
                  <span className="block h-1 overflow-hidden rounded-full bg-on-inverse/20">
                    <span
                      className={cn(
                        "block h-full origin-left rounded-full bg-on-inverse transition-transform duration-500 ease-out",
                        i === index ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50",
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "mt-2.5 hidden truncate text-xs font-semibold transition-colors lg:block",
                      i === index ? "text-on-inverse" : "text-on-inverse-muted group-hover:text-on-inverse",
                    )}
                  >
                    {s.categoryName}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex shrink-0 gap-3">
          <ChevronButton direction="left" label="Diapositive précédente" onClick={() => step(-1)} />
          <ChevronButton direction="right" label="Diapositive suivante" onClick={() => step(1)} />
        </div>
      </Container>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
