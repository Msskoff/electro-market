"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { deleteProduct, discardProductDraft, publishProduct, saveProductDraft } from "@/lib/admin/actions";
import type { PublishState } from "@/lib/admin/queries";
import type { ProductInput } from "@/lib/admin/schemas";
import type { Brand, Category } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/utils/format";
import { slugify } from "@/lib/utils/slug";
import { cn } from "@/lib/utils/cn";
import {
  AddButton,
  FaqList,
  FormSection,
  IconButton,
  IntInput,
  MoneyInput,
  move,
  SelectInput,
  StringList,
  TextArea,
  TextInput,
  Toggle,
} from "./fields";
import { ImagesEditor } from "./ImagesEditor";
import { SaveBar } from "./SaveBar";
import { StockToggle } from "./StockToggle";
import { PublishStateBadge } from "./ui";
import { useDraftEditor } from "./useDraftEditor";

type Variant = ProductInput["variants"][number];

/** Référence proposée : MARQUE-NOM-OPTION-COULEUR (ex. AUR-ONE5G-128-NOI). */
function suggestSku(p: ProductInput, v: Variant): string {
  const part = (s: string, n: number) => slugify(s).replace(/-/g, "").toUpperCase().slice(0, n);
  return [part(p.brand, 3), part(p.name.replace(new RegExp(`^${p.brand}`, "i"), ""), 8), part(v.option ?? "", 5), part(v.color.name, 3)]
    .filter(Boolean)
    .join("-");
}

export function ProductEditor({
  initial,
  isNew,
  state,
  draftSavedAt,
  publishedAt,
  publicPath,
  inStock,
  brands,
  categories,
}: {
  initial: ProductInput;
  isNew: boolean;
  state: PublishState;
  draftSavedAt: string | null;
  publishedAt: string | null;
  publicPath: string | null;
  inStock: boolean;
  brands: Brand[];
  categories: Category[];
}) {
  const router = useRouter();
  const idRef = useRef(initial.id);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const save = useCallback(
    async (value: ProductInput) => {
      const id = idRef.current || slugify(value.slug || value.name) || "produit";
      const result = await saveProductDraft({ ...value, id }, { isNew: isNew && !idRef.current });
      if (result.ok) {
        const created = !idRef.current;
        idRef.current = result.id;
        // Nouveau produit : l'adresse de l'éditeur devient la sienne (rechargement = brouillon retrouvé).
        if (created) router.replace(`/admin/produits/${result.id}`, { scroll: false });
      }
      return result;
    },
    [isNew, router],
  );
  const publish = useCallback(() => publishProduct(idRef.current), []);
  const discard = useCallback(() => discardProductDraft(idRef.current), []);

  const editor = useDraftEditor<ProductInput>({ initial, initialState: isNew ? "draft-only" : state, draftSavedAt, publishedAt, save, publish, discard });
  const { value: p, setValue, errors } = editor;
  const e = (path: string) => errors[path];
  const set = <K extends keyof ProductInput>(key: K, v: ProductInput[K]) => setValue((prev) => ({ ...prev, [key]: v }));
  const setVariant = (i: number, patch: Partial<Variant>) =>
    setValue((prev) => ({ ...prev, variants: prev.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  const category = categories.find((c) => c.slug === p.category);
  const brand = brands.find((b) => b.slug === p.brand);
  const prices = p.variants.map((v) => v.price).filter((n) => n > 0);
  const seoTitle = `${p.name} ${p.highlights[0] ?? ""}`.trim() + " – ElectronikTogo";
  const publicUrl = `/${p.category}/${p.slug || slugify(p.name)}`;
  const errorCount = Object.keys(errors).length;

  function onDelete() {
    if (!window.confirm(`Supprimer définitivement « ${p.name || "ce produit"} » ? Son adresse redirigera vers la catégorie.`)) return;
    startDelete(async () => {
      const result = isNew && !idRef.current ? { ok: true as const } : await deleteProduct(idRef.current);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      router.push("/admin/produits");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        {errorCount > 0 && (
          <div role="alert" className="rounded-xl border border-danger bg-danger-soft p-4 text-sm text-danger">
            <p className="font-semibold">{errorCount} champ(s) à corriger avant d&apos;enregistrer :</p>
            <ul className="mt-1 list-inside list-disc">
              {Object.entries(errors)
                .slice(0, 6)
                .map(([k, msg]) => (
                  <li key={k}>{msg}</li>
                ))}
            </ul>
          </div>
        )}

        <FormSection id="infos" title="Informations principales">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Nom du produit"
              value={p.name}
              onChange={(v) => setValue((prev) => ({ ...prev, name: v, ...(slugTouched ? {} : { slug: slugify(v) }) }))}
              error={e("name")}
              className="sm:col-span-2"
              placeholder="Ex. Aurion One 5G"
            />
            <SelectInput label="Marque" value={p.brand} onChange={(v) => set("brand", v)} options={brands.map((b) => ({ value: b.slug, label: b.name }))} error={e("brand")} hint="Nouvelle marque : menu Marques." />
            <SelectInput
              label="Catégorie"
              value={p.category}
              onChange={(v) => setValue((prev) => ({ ...prev, category: v, kind: categories.find((c) => c.slug === v)?.kind ?? prev.kind }))}
              options={categories.map((c) => ({ value: c.slug, label: c.name }))}
              error={e("category")}
            />
            <TextInput
              label="Adresse de la page"
              value={p.slug}
              onChange={(v) => {
                setSlugTouched(true);
                set("slug", v.toLowerCase());
              }}
              error={e("slug")}
              hint={`Page : /${p.category}/${p.slug || "…"}${state !== "draft-only" ? ". La modifier crée une redirection automatique." : ""}`}
            />
            <TextInput label="Date de sortie" type="date" value={p.releasedAt} onChange={(v) => set("releasedAt", v)} error={e("releasedAt")} />
            <TextInput label="Référence fabricant (MPN)" value={p.mpn ?? ""} onChange={(v) => set("mpn", v)} error={e("mpn")} hint="Facultatif" />
            <SelectInput
              label="Type d'appareil (illustration)"
              value={p.kind}
              onChange={(v) => set("kind", v as ProductInput["kind"])}
              options={[
                { value: "phone", label: "Smartphone" },
                { value: "laptop", label: "Ordinateur portable" },
              ]}
            />
            <div className="sm:col-span-2">
              <Toggle label="Mettre en avant" hint="Apparaît en premier dans la sélection de l'accueil." checked={!!p.featured} onChange={(v) => set("featured", v)} />
            </div>
          </div>
        </FormSection>

        <FormSection id="textes" title="Textes de la fiche" description="Factuels et uniques : ils servent à Google et aux assistants IA. Jamais copiés du fabricant.">
          <div className="flex flex-col gap-5">
            <TextArea label="Résumé (2–3 phrases : ce que c'est, pour qui, point fort)" value={p.summary} onChange={(v) => set("summary", v)} error={e("summary")} rows={3} maxLength={400} />
            <StringList
              label="Description"
              items={p.description}
              onChange={(v) => set("description", v)}
              addLabel="Ajouter un paragraphe"
              max={8}
              multiline
              itemLabel={(i) => `Paragraphe ${i + 1}`}
              errorFor={(i) => e(`description.${i}`)}
            />
            <StringList
              label="Caractéristiques clés (affichées sur les cartes, 3 maximum)"
              items={p.highlights}
              onChange={(v) => set("highlights", v)}
              addLabel="Ajouter une caractéristique"
              max={3}
              itemLabel={(i) => `Caractéristique ${i + 1}`}
              errorFor={(i) => e(`highlights.${i}`)}
            />
          </div>
        </FormSection>

        <FormSection id="variantes" title="Variantes, prix, stock et photos" description="Une variante par combinaison capacité × couleur. Le libellé (« 256 Go · Graphite ») est calculé automatiquement.">
          <div className="flex flex-col gap-4">
            {p.variants.map((v, i) => (
              <fieldset key={i} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <legend className="flex items-center gap-2 text-sm font-semibold">
                    <span aria-hidden className="size-4 rounded-full ring-1 ring-border-strong" style={{ backgroundColor: v.color.hex }} />
                    Variante {i + 1}
                    {(v.option || v.color.name) && <span className="font-normal text-muted">— {[v.option, v.color.name].filter(Boolean).join(" · ")}</span>}
                  </legend>
                  <div className="flex">
                    <IconButton label={`Monter la variante ${i + 1}`} icon="arrowUp" onClick={() => set("variants", move(p.variants, i, -1))} disabled={i === 0} />
                    <IconButton label={`Descendre la variante ${i + 1}`} icon="arrowDown" onClick={() => set("variants", move(p.variants, i, 1))} disabled={i === p.variants.length - 1} />
                    <IconButton label={`Dupliquer la variante ${i + 1}`} icon="plus" onClick={() => set("variants", [...p.variants.slice(0, i + 1), { ...v, sku: "", images: [] }, ...p.variants.slice(i + 1)])} />
                    <IconButton label={`Supprimer la variante ${i + 1}`} icon="trash" tone="danger" onClick={() => set("variants", p.variants.filter((_, j) => j !== i))} disabled={p.variants.length === 1} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <TextInput label="Capacité / configuration" value={v.option ?? ""} onChange={(x) => setVariant(i, { option: x })} error={e(`variants.${i}.option`)} placeholder="Ex. 256 Go" />
                  <TextInput label="Couleur" value={v.color.name} onChange={(x) => setVariant(i, { color: { ...v.color, name: x } })} error={e(`variants.${i}.color.name`)} />
                  <div className="flex items-end gap-2">
                    <TextInput label="Teinte" type="color" value={v.color.hex} onChange={(x) => setVariant(i, { color: { ...v.color, hex: x } })} error={e(`variants.${i}.color.hex`)} className="w-24" />
                    <TextInput label="Code" value={v.color.hex} onChange={(x) => setVariant(i, { color: { ...v.color, hex: x } })} className="flex-1" />
                  </div>
                  <div className="flex items-end gap-1">
                    <TextInput label="Référence (SKU)" value={v.sku} onChange={(x) => setVariant(i, { sku: x.toUpperCase() })} error={e(`variants.${i}.sku`)} className="flex-1" />
                    <IconButton label="Proposer une référence" icon="sparkle" onClick={() => setVariant(i, { sku: suggestSku(p, v) })} />
                  </div>
                  <MoneyInput label="Prix (F CFA)" value={v.price} onChange={(x) => setVariant(i, { price: x ?? 0 })} error={e(`variants.${i}.price`)} />
                  <MoneyInput label="Prix barré (si remise réelle)" value={v.compareAtPrice} onChange={(x) => setVariant(i, { compareAtPrice: x })} error={e(`variants.${i}.compareAtPrice`)} optional />
                  <IntInput label="Stock (unités)" value={v.stock} onChange={(x) => setVariant(i, { stock: x })} error={e(`variants.${i}.stock`)} hint={v.stock === 0 ? "0 = variante en rupture" : v.stock <= 5 ? "Stock faible" : undefined} />
                  <TextInput label="GTIN / EAN" value={v.gtin ?? ""} onChange={(x) => setVariant(i, { gtin: x })} error={e(`variants.${i}.gtin`)} hint="Code-barres, facultatif" inputMode="numeric" />
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Photos de cette variante</p>
                  <ImagesEditor
                    images={v.images ?? []}
                    onChange={(images) => setVariant(i, { images })}
                    productId={initial.id || slugify(p.slug || p.name) || "nouveau"}
                    defaultAlt={`${p.name || "Produit"} ${v.color.name}, vue de face`}
                    errorFor={(path) => e(`variants.${i}.images.${path}`)}
                  />
                </div>
              </fieldset>
            ))}
            <div>
              <AddButton
                onClick={() => set("variants", [...p.variants, { sku: "", option: "", color: { name: "", hex: "#16181D" }, price: 0, stock: 0, images: [] }])}
                disabled={p.variants.length >= 30}
              >
                Ajouter une variante
              </AddButton>
            </div>
          </div>
        </FormSection>

        <FormSection id="specs" title="Caractéristiques techniques" description="Groupées (Écran, Performances…), toujours avec leur unité. Affichées en tableau sur la fiche.">
          <div className="flex flex-col gap-4">
            {p.specs.map((g, gi) => (
              <div key={gi} className="rounded-lg border border-border p-4">
                <div className="flex items-end gap-1">
                  <TextInput label={`Groupe ${gi + 1}`} value={g.label} onChange={(x) => set("specs", p.specs.map((s, j) => (j === gi ? { ...s, label: x } : s)))} error={e(`specs.${gi}.label`)} className="flex-1" />
                  <IconButton label={`Monter le groupe ${gi + 1}`} icon="arrowUp" onClick={() => set("specs", move(p.specs, gi, -1))} disabled={gi === 0} />
                  <IconButton label={`Descendre le groupe ${gi + 1}`} icon="arrowDown" onClick={() => set("specs", move(p.specs, gi, 1))} disabled={gi === p.specs.length - 1} />
                  <IconButton label={`Supprimer le groupe ${gi + 1}`} icon="trash" tone="danger" onClick={() => set("specs", p.specs.filter((_, j) => j !== gi))} />
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:pl-4">
                  {g.specs.map((s, si) => {
                    const setRow = (patch: Partial<typeof s>) =>
                      set("specs", p.specs.map((grp, j) => (j === gi ? { ...grp, specs: grp.specs.map((r, k) => (k === si ? { ...r, ...patch } : r)) } : grp)));
                    return (
                      <div key={si} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                        <TextInput label="Libellé" value={s.label} onChange={(x) => setRow({ label: x })} error={e(`specs.${gi}.specs.${si}.label`)} />
                        <TextInput label="Valeur (avec unité)" value={s.value} onChange={(x) => setRow({ value: x })} error={e(`specs.${gi}.specs.${si}.value`)} />
                        <IconButton
                          label={`Supprimer la ligne ${s.label || si + 1}`}
                          icon="trash"
                          tone="danger"
                          onClick={() => set("specs", p.specs.map((grp, j) => (j === gi ? { ...grp, specs: grp.specs.filter((_, k) => k !== si) } : grp)))}
                          disabled={g.specs.length === 1}
                        />
                      </div>
                    );
                  })}
                  <div>
                    <AddButton onClick={() => set("specs", p.specs.map((grp, j) => (j === gi ? { ...grp, specs: [...grp.specs, { label: "", value: "" }] } : grp)))}>Ajouter une ligne</AddButton>
                  </div>
                </div>
              </div>
            ))}
            <div>
              <AddButton onClick={() => set("specs", [...p.specs, { label: "", specs: [{ label: "", value: "" }] }])}>Ajouter un groupe</AddButton>
            </div>
          </div>
        </FormSection>

        <FormSection id="boite" title="Contenu de la boîte">
          <StringList label="Éléments fournis" items={p.inTheBox} onChange={(v) => set("inTheBox", v)} addLabel="Ajouter un élément" itemLabel={(i) => `Élément ${i + 1}`} errorFor={(i) => e(`inTheBox.${i}`)} />
        </FormSection>

        <FormSection id="faq" title="Questions fréquentes du produit" description="Formulées comme les vraies questions des acheteurs (« Est-il compatible 5G ? »).">
          <FaqList items={p.faq} onChange={(v) => set("faq", v)} errorFor={(path) => e(`faq.${path}`)} />
        </FormSection>

        {!isNew && (
          <section aria-labelledby="danger" className="rounded-xl border border-danger/40 bg-surface p-5 sm:p-6">
            <h2 id="danger" className="text-h3 font-semibold text-danger">
              Supprimer le produit
            </h2>
            <p className="mt-1 text-sm text-muted">Définitif. L&apos;adresse du produit redirigera vers sa catégorie (pas de page d&apos;erreur pour Google).</p>
            {deleteError && <p className="mt-2 text-sm text-danger">{deleteError}</p>}
            <button type="button" onClick={onDelete} disabled={deleting} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-danger px-5 text-sm font-semibold text-on-accent disabled:opacity-50">
              <Icon name="trash" size={18} />
              {deleting ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </section>
        )}

        <SaveBar
          status={editor.status}
          pending={editor.pending}
          canPublish={editor.canPublish}
          hasDraft={editor.hasDraft && state !== "draft-only"}
          dirty={editor.dirty}
          onSave={editor.onSave}
          onPublish={editor.onPublish}
          onDiscard={state === "draft-only" || isNew ? undefined : () => editor.onDiscard(initial)}
          viewHref={publicPath}
        />
      </div>

      {/* Aperçu (grand écran) */}
      <aside className="hidden xl:block" aria-label="Aperçu">
        <div className="sticky top-6 flex flex-col gap-4">
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <PublishStateBadge state={isNew ? "draft-only" : state} />
              {!isNew && state !== "draft-only" && <StockToggle id={initial.id} initial={inStock} label={p.name} />}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{brand?.name}</p>
            <p className="mt-1 text-h3 font-semibold">{p.name || "Nom du produit"}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {p.highlights.filter(Boolean).map((h) => (
                <li key={h} className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">
                  {h}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-lg font-bold tabular">{prices.length ? `${prices.length > 1 && Math.min(...prices) !== Math.max(...prices) ? "dès " : ""}${formatPrice(Math.min(...prices))}` : "Prix à définir"}</p>
            <p className="text-xs text-muted">
              {p.variants.length} variante(s) · {p.variants.reduce((s, v) => s + (v.stock || 0), 0)} unité(s) · {category?.name}
            </p>
          </div>

          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aperçu dans Google</p>
            <p className="mt-3 truncate text-xs text-signal">electroniktogo{publicUrl}</p>
            <p className={cn("mt-0.5 text-base font-medium leading-snug text-accent", seoTitle.length > 60 && "text-danger")}>{seoTitle}</p>
            <p className="mt-1 line-clamp-3 text-sm text-muted">{p.summary || "Le résumé du produit apparaîtra ici."}</p>
            <p className={cn("mt-2 text-xs", seoTitle.length > 60 ? "text-danger" : "text-muted")}>Titre : {seoTitle.length}/60 caractères</p>
          </div>

          <nav aria-label="Sections du formulaire" className="rounded-xl bg-surface p-3 shadow-sm">
            {[
              ["infos", "Informations"],
              ["textes", "Textes"],
              ["variantes", "Variantes et photos"],
              ["specs", "Caractéristiques"],
              ["boite", "Contenu de la boîte"],
              ["faq", "Questions fréquentes"],
            ].map(([id, label]) => (
              <Link key={id} href={`#${id}`} className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}
