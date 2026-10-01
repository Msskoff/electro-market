import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="bg-glow flex flex-col items-center py-28 text-center">
      <p className="eyebrow text-accent">Erreur 404</p>
      <h1 className="mt-4 text-h1">Cette page n&apos;existe pas</h1>
      <p className="mt-4 max-w-md text-muted">
        Le produit a peut-être été retiré ou l&apos;adresse a changé. Parcourez le catalogue pour retrouver un
        modèle équivalent.
      </p>
      <ButtonLink href="/" className="mt-8">
        Retour à l&apos;accueil
      </ButtonLink>
    </Container>
  );
}
