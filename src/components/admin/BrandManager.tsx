"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { deleteBrand, saveBrand } from "@/lib/admin/actions";
import { slugify } from "@/lib/utils/slug";
import { cn } from "@/lib/utils/cn";
import { IconButton, TextInput } from "./fields";

interface BrandRow {
  slug: string;
  name: string;
  productCount: number;
}

type Feedback = { ok: boolean; text: string } | null;

/** Marques : modifiées directement (pas de brouillon), confirmation affichée à chaque action. */
export function BrandManager({ brands }: { brands: BrandRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(brands.map((b) => [b.slug, b.name])));
  const [newName, setNewName] = useState("");
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  const run = (key: string, action: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      setFeedback((f) => ({ ...f, [key]: { ok: true, text: "Enregistrement…" } }));
      const result = await action();
      setFeedback((f) => ({ ...f, [key]: result.ok ? { ok: true, text: success } : { ok: false, text: result.error ?? "Échec" } }));
      if (result.ok) router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex flex-col gap-3 rounded-xl bg-surface p-5 shadow-sm sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          run("__new", () => saveBrand({ slug: slugify(name), name }), `Marque « ${name} » ajoutée`);
          setNewName("");
        }}
      >
        <TextInput label="Nouvelle marque" value={newName} onChange={setNewName} className="flex-1" hint={newName ? `Identifiant : ${slugify(newName)}` : undefined} />
        <button type="submit" disabled={pending || !newName.trim()} className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent disabled:opacity-50">
          <Icon name="plus" size={18} />
          Ajouter
        </button>
      </form>
      {feedback.__new && (
        <p role="status" className={cn("text-sm font-semibold", feedback.__new.ok ? "text-signal" : "text-danger")}>
          {feedback.__new.text}
        </p>
      )}

      <ul className="divide-y divide-border rounded-xl bg-surface shadow-sm">
        {brands.map((b) => {
          const current = names[b.slug] ?? b.name;
          const changed = current.trim() !== b.name;
          const fb = feedback[b.slug];
          return (
            <li key={b.slug} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end">
              <TextInput label={`Nom de la marque (${b.productCount} produit${b.productCount > 1 ? "s" : ""})`} value={current} onChange={(v) => setNames((n) => ({ ...n, [b.slug]: v }))} className="flex-1" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pending || !changed}
                  onClick={() => run(b.slug, () => saveBrand({ slug: b.slug, name: current }), "Renommée — en ligne")}
                  className="inline-flex h-11 items-center rounded-full border border-border-strong px-4 text-sm font-semibold disabled:opacity-40"
                >
                  Enregistrer
                </button>
                <IconButton
                  label={b.productCount ? `Impossible de supprimer ${b.name} : ${b.productCount} produit(s)` : `Supprimer ${b.name}`}
                  icon="trash"
                  tone="danger"
                  disabled={pending || b.productCount > 0}
                  onClick={() => {
                    if (window.confirm(`Supprimer la marque « ${b.name} » ?`)) run(b.slug, () => deleteBrand(b.slug), "Supprimée");
                  }}
                />
              </div>
              {fb && (
                <p role="status" className={cn("text-xs font-semibold sm:w-40", fb.ok ? "text-signal" : "text-danger")}>
                  {fb.text}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
