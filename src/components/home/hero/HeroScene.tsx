"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { DeviceIllustration } from "@/components/product/DeviceIllustration";
import type { DeviceKind } from "@/lib/catalog/types";
import type { HeroSlide, HeroVideo } from "@/lib/content/hero-slides";
import { cn } from "@/lib/utils/cn";

/** Animation propre à chaque type d'appareil (combinée au flottement). */
const motion: Record<DeviceKind, string> = {
  phone: "hero-turn",
  laptop: "hero-tilt",
  tablet: "hero-sway",
  watch: "",
  headphones: "",
  earbuds: "hero-sway",
};

/** Ondes concentriques : son (audio) ou pouls (montre). */
const withRings: DeviceKind[] = ["headphones", "earbuds", "watch"];

/** Particules : positions et rythmes fixes (rendu identique serveur/client). */
const particles = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  bottom: `${(i * 17) % 30}%`,
  duration: `${7 + ((i * 3) % 6)}s`,
  delay: `${-((i * 1.3) % 8).toFixed(1)}s`,
  size: i % 4 === 0 ? 6 : i % 3 === 0 ? 4 : 3,
}));

function SceneVideo({ video, active }: { video: HeroVideo; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (active && !reduced) el.play().catch(() => {});
    else el.pause();
  }, [active]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 size-full object-cover lg:object-right"
      poster={video.poster}
      muted
      loop
      playsInline
      preload={active ? "auto" : "none"}
      aria-hidden
    >
      {video.webm && <source src={video.webm} type="video/webm" />}
      {video.mp4 && <source src={video.mp4} type="video/mp4" />}
    </video>
  );
}

/**
 * Arrière-plan d'une diapositive : vraie vidéo si fournie, sinon scène animée
 * (lueurs, balayage lumineux, particules, appareil en mouvement).
 */
export function HeroScene({
  kind,
  color,
  tone,
  video,
  active,
}: {
  kind: DeviceKind;
  color: string;
  tone: HeroSlide["tone"];
  video?: HeroVideo;
  active: boolean;
}) {
  const style = { "--glow": `var(--tile-${tone})` } as CSSProperties;

  return (
    <div className="hero-scene absolute inset-0 overflow-hidden" style={style} aria-hidden>
      <div className={cn("absolute inset-0", active && "hero-kenburns")}>
        {video ? (
          <SceneVideo video={video} active={active} />
        ) : (
          <>
            {/* Trame de points discrète */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: "radial-gradient(var(--on-inverse) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Lueurs colorées */}
            <div className="absolute left-1/2 top-[25%] aspect-square w-[130vw] max-w-[820px] -translate-x-1/2 -translate-y-1/2 lg:left-[70%] lg:top-1/2 lg:w-[62vw]">
              <div
                className="hero-drift size-full rounded-full"
                style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--glow) 62%, transparent) 0%, transparent 62%)" }}
              />
            </div>
            <div className="absolute left-[10%] top-[4%] aspect-square w-[70vw] max-w-[440px] lg:left-[78%]">
              <div
                className="hero-drift size-full rounded-full [animation-delay:-8s]"
                style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--glow) 30%, transparent) 0%, transparent 65%)" }}
              />
            </div>

            {/* Balayage lumineux */}
            <div className="hero-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-on-inverse/[0.07] to-transparent" />

            {/* Particules */}
            {particles.map((p, i) => (
              <span
                key={i}
                className="hero-rise absolute rounded-full bg-on-inverse/50"
                style={{
                  left: p.left,
                  bottom: p.bottom,
                  width: p.size,
                  height: p.size,
                  animationDuration: p.duration,
                  animationDelay: p.delay,
                }}
              />
            ))}

            {/* Appareil */}
            <div className="absolute left-1/2 top-[27%] aspect-square w-[min(50vw,220px)] -translate-x-1/2 -translate-y-1/2 sm:top-[30%] sm:w-[min(50vw,320px)] lg:left-[70%] lg:top-1/2 lg:w-[min(36vw,500px)]">
              {withRings.includes(kind) &&
                [0, 1.2, 2.4].map((delay) => (
                  <span
                    key={delay}
                    className="hero-ring absolute left-1/2 top-1/2 size-[92%] rounded-full border border-on-inverse/30"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              <span className="hero-shadow absolute bottom-[2%] left-1/2 h-[7%] w-[60%] rounded-[50%] bg-inverse blur-md" />
              <div className="hero-float absolute inset-0">
                <div className={cn("absolute inset-0", motion[kind])}>
                  <DeviceIllustration
                    kind={kind}
                    color={color}
                    className="text-on-inverse drop-shadow-[0_30px_40px_rgb(0_0_0_/_0.45)]"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
