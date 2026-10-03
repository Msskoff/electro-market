"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { uploadProductImage } from "@/lib/admin/actions";
import type { ProductImage } from "@/lib/catalog/types";
import { IconButton, move, TextInput } from "./fields";

const MAX_SIDE = 2000;

/**
 * Prépare une photo dans le navigateur, avant envoi :
 *  - redimensionnée à 2 000 px maximum et convertie en WebP (≈ 5 à 10 fois plus légère) ;
 *  - dimensions réelles relevées (aucun décalage de mise en page sur le site) ;
 *  - miniature floue de 12 px en data URL (affichée instantanément pendant le chargement).
 */
async function prepare(file: File): Promise<{ blob: Blob; width: number; height: number; blurDataURL: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible"))), "image/webp", 0.85),
  );

  const tiny = document.createElement("canvas");
  tiny.width = 12;
  tiny.height = Math.max(1, Math.round((12 * height) / width));
  tiny.getContext("2d")!.drawImage(bitmap, 0, 0, tiny.width, tiny.height);
  const blurDataURL = tiny.toDataURL("image/webp", 0.4);
  bitmap.close();
  return { blob, width, height, blurDataURL };
}

export function ImagesEditor({
  images,
  onChange,
  productId,
  defaultAlt,
  errorFor,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  productId: string;
  defaultAlt: string;
  errorFor?: (path: string) => string | undefined;
}) {
  const inputId = useId();
  const [uploads, setUploads] = useState<{ name: string; state: "envoi" | "erreur"; message?: string }[]>([]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, 8 - images.length);
    setUploads(list.map((f) => ({ name: f.name, state: "envoi" })));
    const added: ProductImage[] = [];
    for (const file of list) {
      try {
        const { blob, width, height, blurDataURL } = await prepare(file);
        const form = new FormData();
        form.set("file", new File([blob], "photo.webp", { type: "image/webp" }));
        form.set("productId", productId);
        const result = await uploadProductImage(form);
        if (!result.ok) throw new Error(result.error);
        added.push({ src: result.src, alt: defaultAlt, width, height, blurDataURL });
        setUploads((u) => u.filter((x) => x.name !== file.name));
      } catch (e) {
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, state: "erreur", message: e instanceof Error ? e.message : "Échec de l'envoi" } : x)));
      }
    }
    if (added.length) onChange([...images, ...added]);
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((img, i) => (
            <li key={img.src} className="flex gap-3 rounded-lg border border-border p-2">
              <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2">
                <Image src={img.src} alt="" width={img.width} height={img.height} sizes="80px" quality={60} className="max-h-full w-auto object-contain" />
                {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-inverse px-1.5 text-xs font-semibold text-on-inverse">1re</span>}
              </div>
              <div className="min-w-0 flex-1">
                <TextInput
                  label={`Description de la photo ${i + 1}`}
                  value={img.alt}
                  onChange={(v) => onChange(images.map((x, j) => (j === i ? { ...x, alt: v } : x)))}
                  error={errorFor?.(`${i}.alt`)}
                  hint={`${img.width} × ${img.height} px`}
                />
                <div className="mt-1 flex">
                  <IconButton label={`Avancer la photo ${i + 1}`} icon="arrowUp" onClick={() => onChange(move(images, i, -1))} disabled={i === 0} />
                  <IconButton label={`Reculer la photo ${i + 1}`} icon="arrowDown" onClick={() => onChange(move(images, i, 1))} disabled={i === images.length - 1} />
                  <IconButton label={`Retirer la photo ${i + 1}`} icon="trash" tone="danger" onClick={() => onChange(images.filter((_, j) => j !== i))} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {uploads.length > 0 && (
        <ul role="status" aria-live="polite" className="flex flex-col gap-1 text-sm">
          {uploads.map((u) => (
            <li key={u.name} className={u.state === "erreur" ? "text-danger" : "text-muted"}>
              {u.state === "envoi" ? `Optimisation et envoi de ${u.name}…` : `${u.name} : ${u.message}`}
            </li>
          ))}
        </ul>
      )}

      {images.length < 8 && (
        <div>
          <label
            htmlFor={inputId}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-dashed border-border-strong px-4 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
          >
            <Icon name="image" size={18} />
            Ajouter des photos
          </label>
          <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = "";
          }} />
          <p className="mt-1.5 text-xs text-muted">
            Photo carrée sur fond uni de préférence. Elle est automatiquement redimensionnée et convertie avant l&apos;envoi. La 1re photo est la photo principale.
          </p>
        </div>
      )}
    </div>
  );
}
