/** Préparation d'image dans le navigateur (admin : photos produit ; client : preuves de paiement). */
const MAX_SIDE = 2000;

/**
 * Prépare une photo dans le navigateur, avant envoi :
 *  - redimensionnée à 2 000 px maximum et convertie en WebP (≈ 5 à 10 fois plus légère) ;
 *  - dimensions réelles relevées (aucun décalage de mise en page sur le site) ;
 *  - miniature floue de 12 px en data URL (affichée instantanément pendant le chargement).
 */
export async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number; blurDataURL: string }> {
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
