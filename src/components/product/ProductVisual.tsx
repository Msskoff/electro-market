import Image from "next/image";
import type { DeviceKind, ProductImage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils/cn";
import { DeviceIllustration } from "./DeviceIllustration";

/**
 * Visuel d'un produit : la photo si elle existe (next/image : AVIF/WebP, taille adaptée
 * à l'écran, chargement différé, miniature floue instantanée), sinon l'illustration
 * vectorielle teintée. Utilisable dans les composants serveur et client.
 *
 * `sizes` est OBLIGATOIRE et doit décrire la largeur affichée : c'est lui qui évite
 * d'envoyer une photo de 1 600 px à un téléphone qui en affiche 180.
 */
export function ProductVisual({
  image,
  kind,
  color,
  alt,
  sizes,
  preload = false,
  eager = false,
  className,
}: {
  image?: ProductImage;
  kind: DeviceKind;
  color: string;
  /** Texte alternatif ; vide = décoratif (ex. miniature à côté du nom du produit). */
  alt: string;
  sizes: string;
  /** Visuel principal au-dessus de la ligne de flottaison (élément LCP) : chargé en priorité. */
  preload?: boolean;
  /** Visible dès l'arrivée sur la page (première rangée de cartes) : pas de chargement différé. */
  eager?: boolean;
  className?: string;
}) {
  if (!image) {
    return <DeviceIllustration kind={kind} color={color} label={alt || undefined} className={className} />;
  }
  return (
    <Image
      src={image.src}
      alt={alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      quality={75}
      placeholder={image.blurDataURL ? "blur" : "empty"}
      blurDataURL={image.blurDataURL}
      preload={preload}
      loading={preload ? undefined : eager ? "eager" : "lazy"}
      className={cn("h-auto max-h-full w-auto max-w-full object-contain", className)}
    />
  );
}

/** Miniature (recherche, panier) : petite taille fixe, qualité réduite suffisante. */
export function ProductThumb({
  image,
  kind,
  color,
  size = 48,
  className,
}: {
  image?: ProductImage;
  kind: DeviceKind;
  color: string;
  size?: number;
  className?: string;
}) {
  if (!image) return <DeviceIllustration kind={kind} color={color} className={className} />;
  return (
    <Image
      src={image.src}
      alt=""
      width={image.width}
      height={image.height}
      sizes={`${size}px`}
      quality={60}
      placeholder={image.blurDataURL ? "blur" : "empty"}
      blurDataURL={image.blurDataURL}
      className={cn("h-auto max-h-full w-auto max-w-full object-contain", className)}
    />
  );
}
