"use client";

import { useCallback, useState } from "react";
import { discardSettingsDraft, publishSettings, saveSettingsDraft } from "@/lib/admin/actions";
import type { PublishState } from "@/lib/admin/queries";
import { FAQ_VARIABLES, HERO_TONES, renderFaqText, type HeroSlide, type PaymentMethodConfig, type StoreSettings } from "@/lib/settings/types";
import { cn } from "@/lib/utils/cn";
import { AddButton, FaqList, FormSection, IconButton, IntInput, MoneyInput, move, SelectInput, StringList, TextArea, TextInput, Toggle } from "./fields";
import { SaveBar } from "./SaveBar";
import { useDraftEditor } from "./useDraftEditor";

const tabs = [
  { id: "boutique", label: "Boutique et contact" },
  { id: "livraison", label: "Livraison et garanties" },
  { id: "paiement", label: "Paiement" },
  { id: "accueil", label: "Accueil (hero)" },
  { id: "faq", label: "FAQ du site" },
] as const;

const toneLabels: Record<string, string> = { peach: "Pêche", sand: "Sable", sky: "Ciel", rose: "Rose", lilac: "Lilas" };

export function SettingsEditor({
  initial,
  state,
  draftSavedAt,
  publishedAt,
  products,
  categories,
}: {
  initial: StoreSettings;
  state: PublishState;
  draftSavedAt: string | null;
  publishedAt: string | null;
  products: { slug: string; name: string; category: string }[];
  categories: { slug: string; name: string }[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("boutique");
  const save = useCallback((value: StoreSettings) => saveSettingsDraft(value), []);
  const editor = useDraftEditor<StoreSettings>({ initial, initialState: state, draftSavedAt, publishedAt, save, publish: publishSettings, discard: discardSettingsDraft });
  const { value: s, setValue, errors } = editor;
  const e = (path: string) => errors[path];
  const setContact = (patch: Partial<StoreSettings["contact"]>) => setValue((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));
  const setAddress = (patch: Partial<StoreSettings["contact"]["address"]>) => setContact({ address: { ...s.contact.address, ...patch } });
  const setPolicies = (patch: Partial<StoreSettings["policies"]>) => setValue((prev) => ({ ...prev, policies: { ...prev.policies, ...patch } }));
  const setMethod = (i: number, patch: Partial<PaymentMethodConfig>) =>
    setValue((prev) => ({ ...prev, payment: { methods: prev.payment.methods.map((m, j) => (j === i ? { ...m, ...patch } : m)) } }));
  const setSlide = (i: number, patch: Partial<HeroSlide>) => setValue((prev) => ({ ...prev, heroSlides: prev.heroSlides.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  // Onglets portant une erreur : signalés par une pastille.
  const tabHasError = (id: string) =>
    Object.keys(errors).some((k) =>
      id === "boutique" ? k.startsWith("contact") || k.startsWith("social") : id === "livraison" ? k.startsWith("policies") : id === "paiement" ? k.startsWith("payment") : id === "accueil" ? k.startsWith("heroSlides") : k.startsWith("faq"),
    );

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Sections de la configuration" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.id ? "bg-inverse text-on-inverse" : "bg-surface text-muted shadow-sm hover:text-fg",
            )}
          >
            {t.label}
            {tabHasError(t.id) && <span aria-label="(erreur)" className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-danger" />}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "boutique" && (
          <div className="flex flex-col gap-5">
            <FormSection id="contact" title="Coordonnées" description="Affichées dans le pied de page, la page d'aide et les données lues par Google et les assistants IA.">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="E-mail de contact" type="email" value={s.contact.email} onChange={(v) => setContact({ email: v })} error={e("contact.email")} />
                <TextInput label="Téléphone" type="tel" value={s.contact.phone} onChange={(v) => setContact({ phone: v })} error={e("contact.phone")} />
                <TextInput label="Adresse" value={s.contact.address.street} onChange={(v) => setAddress({ street: v })} error={e("contact.address.street")} className="sm:col-span-2" />
                <TextInput label="Ville" value={s.contact.address.city} onChange={(v) => setAddress({ city: v })} error={e("contact.address.city")} />
                <TextInput label="Région" value={s.contact.address.region} onChange={(v) => setAddress({ region: v })} error={e("contact.address.region")} />
                <TextInput label="Pays (code)" value={s.contact.address.country} onChange={(v) => setAddress({ country: v.toUpperCase() })} error={e("contact.address.country")} hint="TG pour le Togo." maxLength={2} />
              </div>
            </FormSection>
            <FormSection id="social" title="Réseaux sociaux" description="Adresses complètes des pages officielles (https://…).">
              <StringList label="Profils" items={s.social} onChange={(v) => setValue((prev) => ({ ...prev, social: v }))} addLabel="Ajouter un profil" max={10} itemLabel={(i) => `Profil ${i + 1}`} errorFor={(i) => e(`social.${i}`)} />
            </FormSection>
            <FormSection id="demo" title="Bandeau « Démo »">
              <Toggle
                label="Afficher « Démo — produits fictifs » en haut du site"
                hint="À désactiver au lancement réel, avec le vrai catalogue."
                checked={s.demoMode}
                onChange={(v) => setValue((prev) => ({ ...prev, demoMode: v }))}
              />
            </FormSection>
          </div>
        )}

        {tab === "livraison" && (
          <FormSection id="politiques" title="Livraison, retours et garantie" description="Repris partout : bandeau du haut, fiches produit, panier, FAQ, données structurées.">
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyInput label="Frais de livraison" value={s.policies.shippingCost} onChange={(v) => setPolicies({ shippingCost: v ?? 0 })} error={e("policies.shippingCost")} />
              <MoneyInput label="Livraison offerte à partir de" value={s.policies.freeShippingThreshold} onChange={(v) => setPolicies({ freeShippingThreshold: v ?? 0 })} error={e("policies.freeShippingThreshold")} />
              <TextInput label="Délai affiché" value={s.policies.shippingDelay} onChange={(v) => setPolicies({ shippingDelay: v })} error={e("policies.shippingDelay")} hint="Ex. « 24 à 48 h à Lomé »." />
              <div className="grid grid-cols-2 gap-3">
                <IntInput label="Délai min. (jours)" value={s.policies.shippingDays.min} onChange={(v) => setPolicies({ shippingDays: { ...s.policies.shippingDays, min: v } })} error={e("policies.shippingDays.min")} />
                <IntInput label="Délai max. (jours)" value={s.policies.shippingDays.max} onChange={(v) => setPolicies({ shippingDays: { ...s.policies.shippingDays, max: v } })} error={e("policies.shippingDays.max")} />
              </div>
              <IntInput label="Jours pour retourner un produit" value={s.policies.returnDays} onChange={(v) => setPolicies({ returnDays: v })} error={e("policies.returnDays")} />
              <IntInput label="Garantie (années)" value={s.policies.warrantyYears} onChange={(v) => setPolicies({ warrantyYears: v })} error={e("policies.warrantyYears")} />
            </div>
          </FormSection>
        )}

        {tab === "paiement" && (
          <FormSection
            id="paiement"
            title="Moyens de paiement"
            description="Proposés au client à la dernière étape de la commande. Mobile money : le client voit le numéro, paie, puis dépose une capture du SMS de confirmation ; vous validez la commande dans Commandes."
          >
            {e("payment.methods") && <p className="mb-3 text-sm font-semibold text-danger">{e("payment.methods")}</p>}
            <div className="flex flex-col gap-4">
              {s.payment.methods.map((m, i) => (
                <fieldset key={m.id} className="rounded-lg border border-border p-4">
                  <legend className="px-1 text-sm font-semibold">{m.label || m.id}</legend>
                  <Toggle label={`Proposer « ${m.label} »`} checked={m.enabled} onChange={(v) => setMethod(i, { enabled: v })} />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <TextInput label="Nom affiché au client" value={m.label} onChange={(v) => setMethod(i, { label: v })} error={e(`payment.methods.${i}.label`)} />
                    {m.id !== "cod" && (
                      <>
                        <TextInput
                          label="Numéro à créditer"
                          type="tel"
                          value={m.number}
                          onChange={(v) => setMethod(i, { number: v })}
                          error={e(`payment.methods.${i}.number`)}
                          hint="Affiché au client quand il choisit ce moyen."
                        />
                        <TextInput label="Nom du titulaire" value={m.accountName} onChange={(v) => setMethod(i, { accountName: v })} error={e(`payment.methods.${i}.accountName`)} hint="Le client le voit à l'écran de confirmation de son opérateur." />
                      </>
                    )}
                    <TextArea label="Marche à suivre" value={m.instructions} onChange={(v) => setMethod(i, { instructions: v })} error={e(`payment.methods.${i}.instructions`)} rows={3} maxLength={500} className="sm:col-span-2" />
                  </div>
                </fieldset>
              ))}
            </div>
          </FormSection>
        )}

        {tab === "accueil" && (
          <FormSection id="hero" title="Diapositives de l'accueil" description="Chacune est liée à un vrai produit : textes fidèles à sa fiche (aucune promesse inventée).">
            <div className="flex flex-col gap-4">
              {s.heroSlides.map((slide, i) => {
                const options = products.filter((p) => p.category === slide.categorySlug);
                return (
                  <fieldset key={i} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <legend className="text-sm font-semibold">Diapositive {i + 1}</legend>
                      <div className="flex">
                        <IconButton label={`Avancer la diapositive ${i + 1}`} icon="arrowUp" onClick={() => setValue((prev) => ({ ...prev, heroSlides: move(prev.heroSlides, i, -1) }))} disabled={i === 0} />
                        <IconButton label={`Reculer la diapositive ${i + 1}`} icon="arrowDown" onClick={() => setValue((prev) => ({ ...prev, heroSlides: move(prev.heroSlides, i, 1) }))} disabled={i === s.heroSlides.length - 1} />
                        <IconButton label={`Supprimer la diapositive ${i + 1}`} icon="trash" tone="danger" onClick={() => setValue((prev) => ({ ...prev, heroSlides: prev.heroSlides.filter((_, j) => j !== i) }))} disabled={s.heroSlides.length === 1} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <SelectInput
                        label="Catégorie"
                        value={slide.categorySlug}
                        onChange={(v) => setSlide(i, { categorySlug: v, productSlug: products.find((p) => p.category === v)?.slug ?? "" })}
                        options={categories.map((c) => ({ value: c.slug, label: c.name }))}
                      />
                      <SelectInput label="Produit" value={slide.productSlug} onChange={(v) => setSlide(i, { productSlug: v })} options={options.map((p) => ({ value: p.slug, label: p.name }))} error={e(`heroSlides.${i}.productSlug`)} />
                      <SelectInput label="Ambiance" value={slide.tone} onChange={(v) => setSlide(i, { tone: v as HeroSlide["tone"] })} options={HERO_TONES.map((t) => ({ value: t, label: toneLabels[t] }))} />
                      <TextInput label="Titre" value={slide.title} onChange={(v) => setSlide(i, { title: v })} error={e(`heroSlides.${i}.title`)} className="sm:col-span-3" />
                      <TextArea label="Texte" value={slide.text} onChange={(v) => setSlide(i, { text: v })} error={e(`heroSlides.${i}.text`)} rows={2} maxLength={300} className="sm:col-span-3" />
                      <TextInput label="Vidéo MP4 (facultatif)" value={slide.video?.mp4 ?? ""} onChange={(v) => setSlide(i, { video: { ...slide.video, mp4: v } })} hint="Adresse du fichier, 1920×1080, < 3 Mo." />
                      <TextInput label="Vidéo WebM (facultatif)" value={slide.video?.webm ?? ""} onChange={(v) => setSlide(i, { video: { ...slide.video, webm: v } })} />
                      <TextInput label="Image d'attente (facultatif)" value={slide.video?.poster ?? ""} onChange={(v) => setSlide(i, { video: { ...slide.video, poster: v } })} />
                    </div>
                  </fieldset>
                );
              })}
              <div>
                <AddButton
                  onClick={() =>
                    setValue((prev) => ({
                      ...prev,
                      heroSlides: [...prev.heroSlides, { categorySlug: categories[0]?.slug ?? "", productSlug: products.find((p) => p.category === categories[0]?.slug)?.slug ?? "", tone: "sky", title: "", text: "" }],
                    }))
                  }
                  disabled={s.heroSlides.length >= 8}
                >
                  Ajouter une diapositive
                </AddButton>
              </div>
            </div>
          </FormSection>
        )}

        {tab === "faq" && (
          <FormSection id="site-faq" title="Questions fréquentes du site" description="Affichées sur l'accueil et la page d'aide.">
            <div className="mb-4 rounded-lg bg-surface-2 p-4 text-sm">
              <p className="font-semibold">Variables (remplacées automatiquement, toujours à jour) :</p>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {Object.entries(FAQ_VARIABLES).map(([v, label]) => (
                  <li key={v}>
                    <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">{v}</code> <span className="text-muted">{label} → {renderFaqText(v, s)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <FaqList items={s.faq} onChange={(v) => setValue((prev) => ({ ...prev, faq: v }))} errorFor={(path) => e(`faq.${path}`)} />
          </FormSection>
        )}
      </div>

      <SaveBar
        status={editor.status}
        pending={editor.pending}
        canPublish={editor.canPublish}
        hasDraft={editor.hasDraft}
        dirty={editor.dirty}
        onSave={editor.onSave}
        onPublish={editor.onPublish}
        onDiscard={() => editor.onDiscard(initial)}
        viewHref="/"
      />
    </div>
  );
}
