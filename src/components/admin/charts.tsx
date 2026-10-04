import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

/**
 * Graphiques du tableau de bord : SVG et HTML rendus côté serveur (aucune bibliothèque,
 * aucun JavaScript envoyé). Couleurs : tokens uniquement. Chaque graphique a un
 * équivalent texte (titres, valeurs, tableaux) pour les lecteurs d'écran.
 */

const nf = new Intl.NumberFormat("fr-FR");
export const num = (n: number) => nf.format(n);

/** Pastille de variation vs période précédente. */
export function Delta({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) return <span className="text-xs font-semibold text-muted">nouveau</span>;
  const good = inverse ? value < 0 : value > 0;
  const flat = value === 0;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular", flat ? "bg-surface-2 text-muted" : good ? "bg-signal-soft text-signal" : "bg-danger-soft text-danger")}>
      {value > 0 ? "▲" : value < 0 ? "▼" : "="} {Math.abs(value)} %
    </span>
  );
}

export function Kpi({ label, value, delta, hint }: { label: string; value: string; delta?: number | null; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-h2 font-bold leading-tight tabular">{value}</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
        {delta !== undefined && <Delta value={delta} />}
        {hint}
      </p>
    </div>
  );
}

export function ChartCard({ id, title, description, children, className, action }: { id: string; title: string; description?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section aria-labelledby={id} className={cn("min-w-0 rounded-xl bg-surface p-5 shadow-sm sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={id} className="text-h3 font-semibold">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-surface-2 p-4 text-sm text-muted">{children}</p>;
}

const dayLabel = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * Évolution quotidienne : visiteurs (aire) et commandes (barres), deux échelles.
 */
export function TrendChart({ data }: { data: { day: string; visitors: number; orders: number; revenue: number }[] }) {
  const W = 720;
  const H = 220;
  const pad = { l: 36, r: 36, t: 12, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const maxV = Math.max(4, ...data.map((d) => d.visitors));
  const maxO = Math.max(2, ...data.map((d) => d.orders));
  const step = data.length > 1 ? iw / (data.length - 1) : iw;
  const x = (i: number) => pad.l + i * step;
  const yV = (v: number) => pad.t + ih - (v / maxV) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yV(d.visitors).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)},${pad.t + ih}L${x(0)},${pad.t + ih}Z`;
  const barW = Math.max(2, Math.min(10, step * 0.4));
  const labelEvery = Math.ceil(data.length / 7);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Visiteurs et commandes par jour">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih * (1 - f)} y2={pad.t + ih * (1 - f)} stroke="var(--border)" />
            <text x={pad.l - 6} y={pad.t + ih * (1 - f) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
              {Math.round(maxV * f)}
            </text>
            <text x={W - pad.r + 6} y={pad.t + ih * (1 - f) + 4} fontSize="11" fill="var(--signal)">
              {Math.round(maxO * f)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          d.orders > 0 ? (
            <rect key={`o${d.day}`} x={x(i) - barW / 2} y={pad.t + ih - (d.orders / maxO) * ih} width={barW} height={(d.orders / maxO) * ih} rx="2" fill="var(--signal)" opacity="0.45">
              <title>{`${dayLabel(d.day)} : ${d.orders} commande(s), ${formatPrice(d.revenue)}`}</title>
            </rect>
          ) : null,
        )}
        <path d={area} fill="var(--accent)" opacity="0.12" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={`v${d.day}`} cx={x(i)} cy={yV(d.visitors)} r={data.length > 40 ? 0 : 3} fill="var(--surface)" stroke="var(--accent)" strokeWidth="2">
            <title>{`${dayLabel(d.day)} : ${d.visitors} visiteur(s)`}</title>
          </circle>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text key={`l${d.day}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
              {dayLabel(d.day)}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded bg-accent" /> Visiteurs (échelle de gauche)
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-signal" /> Commandes (échelle de droite)
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Entonnoir de conversion : barres décroissantes, % du départ et perte entre étapes.
 */
export function FunnelChart({ steps }: { steps: { label: string; value: number; hint?: string }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const drop = prev ? Math.round(((prev - s.value) / prev) * 100) : null;
        const width = Math.max(2, (s.value / top) * 100);
        return (
          <li key={s.label}>
            {drop !== null && (
              <p className="py-1 pl-3 text-xs text-muted">
                <span aria-hidden>↓ </span>
                {prev && prev > 0 ? `${drop} % perdus à cette étape` : "—"}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="relative h-11 flex-1 overflow-hidden rounded-lg bg-surface-2">
                <div className="absolute inset-y-0 left-0 rounded-lg bg-accent" style={{ width: `${width}%`, opacity: 1 - i * 0.12 }} />
                <span className={cn("absolute inset-y-0 left-3 flex items-center text-sm font-semibold", width > 45 ? "text-on-accent" : "text-fg")} style={width > 45 ? undefined : { left: `calc(${width}% + 0.75rem)` }}>
                  {s.label}
                </span>
              </div>
              <span className="w-24 shrink-0 text-right">
                <span className="block font-bold tabular">{num(s.value)}</span>
                <span className="block text-xs text-muted tabular">{Math.round((s.value / top) * 1000) / 10} %</span>
              </span>
            </div>
            {s.hint && <p className="mt-0.5 pl-3 text-xs text-muted">{s.hint}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** Classement en barres horizontales. */
export function BarList({ items, format = num, tone = "accent" }: { items: { label: ReactNode; value: number; href?: string; note?: ReactNode }[]; format?: (n: number) => string; tone?: "accent" | "inverse" | "signal" | "warning" }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const bg = { accent: "bg-accent/15", inverse: "bg-inverse/10", signal: "bg-signal-soft", warning: "bg-warning-soft" }[tone];
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, idx) => (
        <li key={idx} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-3 py-2 text-sm">
          <span aria-hidden className={cn("absolute inset-y-0 left-0 rounded-md", bg)} style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          <span className="relative min-w-0 truncate">
            {item.href ? (
              <Link href={item.href} className="font-medium hover:text-accent">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium">{item.label}</span>
            )}
            {item.note && <span className="ml-2 text-xs text-muted">{item.note}</span>}
          </span>
          <span className="relative shrink-0 font-semibold tabular">{format(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS = ["var(--accent)", "var(--inverse)", "var(--signal)", "var(--warning)", "var(--danger)", "var(--border-strong)"];

/** Répartition (anneau) avec légende chiffrée. */
export function Donut({ items, center, format = num }: { items: { label: string; value: number }[]; center?: string; format?: (n: number) => string }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 120 120" className="size-32 shrink-0 -rotate-90" role="img" aria-label={items.map((i) => `${i.label} ${Math.round((i.value / Math.max(1, total)) * 100)} %`).join(", ")}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="16" />
        {total > 0 &&
          items.map((item, i) => {
            const len = (item.value / total) * c;
            const el = <circle key={item.label} cx="60" cy="60" r={r} fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        {center && (
          <text x="60" y="60" transform="rotate(90 60 60)" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--text)">
            {center}
          </text>
        )}
      </svg>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 tabular">
              <strong>{format(item.value)}</strong> <span className="text-muted">({total ? Math.round((item.value / total) * 100) : 0} %)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DOWS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Affluence par jour de la semaine et heure (heure de Lomé). */
export function Heatmap({ cells }: { cells: { dow: number; hour: number; count: number }[] }) {
  const max = Math.max(1, ...cells.map((c) => c.count));
  const get = (d: number, h: number) => cells.find((c) => c.dow === d && c.hour === h)?.count ?? 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-0.5 text-xs">
        <caption className="sr-only">Pages vues par jour de la semaine et par heure</caption>
        <thead>
          <tr>
            <th scope="col" className="w-10" />
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} scope="col" className="font-normal text-muted">
                {h % 3 === 0 ? `${h}h` : <span className="sr-only">{h}h</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOWS.map((label, i) => (
            <tr key={label}>
              <th scope="row" className="pr-2 text-left font-medium text-muted">
                {label}
              </th>
              {Array.from({ length: 24 }, (_, h) => {
                const v = get(i + 1, h);
                return (
                  <td key={h} title={`${label} ${h}h : ${v} page(s) vue(s)`} className="h-6 rounded-sm" style={{ background: v ? `color-mix(in srgb, var(--accent) ${Math.round(15 + (v / max) * 85)}%, transparent)` : "var(--surface-2)" }}>
                    <span className="sr-only">{v}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
