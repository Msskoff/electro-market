"use client";

import { useCallback } from "react";
import { discardCategoryDraft, publishCategory, saveCategoryDraft } from "@/lib/admin/actions";
import type { PublishState } from "@/lib/admin/queries";
import type { Category } from "@/lib/catalog/types";
import { FaqList, FormSection, SelectInput, TextArea, TextInput } from "./fields";
import { SaveBar } from "./SaveBar";
import { useDraftEditor } from "./useDraftEditor";

export function CategoryEditor({
  initial,
  state,
  draftSavedAt,
  publishedAt,
}: {
  initial: Category;
  state: PublishState;
  draftSavedAt: string | null;
  publishedAt: string | null;
}) {
  const save = useCallback((value: Category) => saveCategoryDraft(value), []);
  const publish = useCallback(() => publishCategory(initial.slug), [initial.slug]);
  const discard = useCallback(() => discardCategoryDraft(initial.slug), [initial.slug]);
  const editor = useDraftEditor<Category>({ initial, initialState: state, draftSavedAt, publishedAt, save, publish, discard });
  const { value: c, setValue, errors } = editor;
  const set = <K extends keyof Category>(key: K, v: Category[K]) => setValue((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="flex flex-col gap-5">
      <FormSection id="cat-infos" title="Présentation" description={`Adresse : /${c.slug} (non modifiable, pour ne pas casser les liens et le référencement).`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Nom (pluriel)" value={c.name} onChange={(v) => set("name", v)} error={errors.name} />
          <TextInput label="Nom au singulier" value={c.singular} onChange={(v) => set("singular", v)} error={errors.singular} hint="Utilisé dans les phrases : « un smartphone »." />
          <TextInput label="Accroche" value={c.tagline} onChange={(v) => set("tagline", v)} error={errors.tagline} hint="Affichée sur les pastilles et encarts de l'accueil." />
          <SelectInput
            label="Type d'appareil"
            value={c.kind}
            onChange={(v) => set("kind", v as Category["kind"])}
            options={[
              { value: "phone", label: "Smartphones" },
              { value: "laptop", label: "Ordinateurs portables" },
            ]}
          />
          <TextArea label="Introduction (2–3 phrases factuelles, reprises par Google)" value={c.intro} onChange={(v) => set("intro", v)} error={errors.intro} rows={4} maxLength={800} className="sm:col-span-2" />
          <TextInput
            label="Mots-clés de recherche"
            value={c.searchKeywords ?? ""}
            onChange={(v) => set("searchKeywords", v)}
            error={errors.searchKeywords}
            hint="Mots que les clients tapent sans qu'ils soient dans le nom (ex. « téléphone mobile portable »)."
            className="sm:col-span-2"
          />
        </div>
      </FormSection>

      <FormSection id="cat-faq" title="Questions fréquentes de la catégorie">
        <FaqList items={c.faq} onChange={(v) => set("faq", v)} errorFor={(path) => errors[`faq.${path}`]} />
      </FormSection>

      <SaveBar
        status={editor.status}
        pending={editor.pending}
        canPublish={editor.canPublish}
        hasDraft={editor.hasDraft}
        dirty={editor.dirty}
        onSave={editor.onSave}
        onPublish={editor.onPublish}
        onDiscard={() => editor.onDiscard(initial)}
        viewHref={`/${c.slug}`}
      />
    </div>
  );
}
