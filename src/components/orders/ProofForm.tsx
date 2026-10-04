"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormAlert } from "@/components/forms/FormAlert";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { submitPaymentProof } from "@/lib/orders/actions";
import { prepareImage } from "@/lib/utils/image-prep";

const inputClass = "mt-1.5 w-full rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-base focus:border-accent focus:outline-none";

/** Heure locale de Lomé (UTC+0) au format du champ datetime-local. */
const nowLome = () => new Date().toISOString().slice(0, 16);

/**
 * Dépôt de la preuve de paiement mobile money : capture du SMS de confirmation
 * (date, référence et montant visibles). Les photos sont allégées dans le navigateur.
 */
export function ProofForm({ orderId, total }: { orderId: string; total: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  async function onFile(f: File | undefined) {
    setError(undefined);
    if (!f) return;
    if (f.type === "application/pdf") {
      setFile(f);
      setPreview(null);
      return;
    }
    try {
      const { blob } = await prepareImage(f);
      const light = new File([blob], "preuve.webp", { type: "image/webp" });
      setFile(light);
      setPreview(URL.createObjectURL(light));
    } catch {
      setFile(f); // format non décodable ici : envoyé tel quel, vérifié côté serveur
      setPreview(null);
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!file) return setError("Ajoutez la capture de votre paiement.");
    data.set("file", file);
    data.set("orderId", orderId);
    startTransition(async () => {
      const result = await submitPaymentProof(data);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="preuve-fichier" className="block text-sm font-medium">
          Capture du paiement (SMS de confirmation)
        </label>
        <label
          htmlFor="preuve-fichier"
          className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border-strong bg-surface p-5 text-center text-sm hover:border-accent"
        >
          {preview ? (
            // Aperçu local (blob:) de la capture choisie, avant envoi.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Aperçu de la capture choisie" className="max-h-56 rounded-md object-contain" />
          ) : (
            <Icon name="upload" size={28} className="text-accent" />
          )}
          <span className="font-semibold">{file ? file.name : "Choisir une photo ou un PDF"}</span>
          <span className="text-muted">Date, référence et montant doivent être lisibles.</span>
        </label>
        <input
          id="preuve-fichier"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="preuve-reference" className="block text-sm font-medium">
            Référence de la transaction
          </label>
          <input id="preuve-reference" name="reference" required minLength={3} maxLength={60} className={inputClass} placeholder="Ex. CI241004.1532.A12345" />
        </div>
        <div>
          <label htmlFor="preuve-montant" className="block text-sm font-medium">
            Montant payé (F CFA)
          </label>
          <input id="preuve-montant" name="amount" type="number" inputMode="numeric" min={1} required defaultValue={total} className={inputClass} />
        </div>
        <div>
          <label htmlFor="preuve-date" className="block text-sm font-medium">
            Date et heure du paiement
          </label>
          <input id="preuve-date" name="paidAt" type="datetime-local" required defaultValue={nowLome()} max={nowLome()} className={inputClass} suppressHydrationWarning />
        </div>
      </div>
      <FormAlert message={error} />
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        <Icon name="upload" size={18} />
        {pending ? "Envoi…" : "Envoyer la preuve"}
      </Button>
    </form>
  );
}
