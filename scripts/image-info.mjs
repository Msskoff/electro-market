#!/usr/bin/env node
/**
 * Prépare une photo produit avant publication.
 *
 *   npm run image:info -- public/produits/aurion-one-5g-graphite-face.jpg [autres fichiers…]
 *
 * Affiche, pour chaque fichier, l'objet `ProductImage` à coller dans le catalogue
 * (dimensions réelles + miniature floue `blurDataURL`) et signale les fichiers
 * mal dimensionnés ou trop lourds. Utilise sharp, déjà installé avec Next.js.
 */
import { stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MIN_WIDTH = 1000; // en dessous : flou sur les écrans haute densité
const MAX_WIDTH = 2400; // au-delà : poids inutile (le site n'affiche jamais plus de 1 600 px)
const MAX_BYTES = 1_500_000;

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage : npm run image:info -- <fichier> [fichier…]");
  process.exit(1);
}

let problems = 0;
for (const file of files) {
  const { size } = await stat(file);
  const meta = await sharp(file).metadata();
  const warnings = [];
  if ((meta.width ?? 0) < MIN_WIDTH) warnings.push(`largeur ${meta.width} px < ${MIN_WIDTH} px : la photo sera floue`);
  if ((meta.width ?? 0) > MAX_WIDTH) warnings.push(`largeur ${meta.width} px > ${MAX_WIDTH} px : réduire à 1 600–2 000 px`);
  if (size > MAX_BYTES) warnings.push(`${Math.round(size / 1024)} Ko : compresser (cible < 500 Ko)`);
  if (meta.width && meta.height && Math.abs(meta.width / meta.height - 1) > 0.25)
    warnings.push("format éloigné du carré : les cartes produit sont carrées (marges vides)");

  // Miniature floue : 12 px de large, WebP, ~200 octets en base64.
  const blur = await sharp(file).resize(12).webp({ quality: 40 }).toBuffer();
  const src = file.replace(/\\/g, "/").replace(/^(\.\/)?public/, "");

  console.log(`\n${path.basename(file)} — ${meta.width}×${meta.height}, ${meta.format}, ${Math.round(size / 1024)} Ko`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log(
    JSON.stringify(
      { src, alt: "À RÉDIGER : « Smartphone X noir, vue de face »", width: meta.width, height: meta.height, blurDataURL: `data:image/webp;base64,${blur.toString("base64")}` },
      null,
      2,
    ),
  );
  problems += warnings.length;
}
process.exit(problems > 0 ? 2 : 0);
