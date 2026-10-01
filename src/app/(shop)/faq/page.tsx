import { Faq } from "@/components/content/Faq";
import { TrustBar } from "@/components/content/TrustBar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { siteFaq } from "@/lib/content/site-faq";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Aide : livraison, retours et garantie",
  description: `Délais de livraison, retours sous ${siteConfig.policies.returnDays} jours, garantie, paiement : toutes les réponses sur vos commandes ${siteConfig.name}.`,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <Container>
      <Breadcrumbs items={[{ name: "Aide", path: "/faq" }]} />
      <SectionHeading
        as="h1"
        eyebrow="Centre d'aide"
        title="Livraison, retours et garantie"
        description="Les informations essentielles sur vos commandes, en clair."
      />
      <div id="livraison" className="mt-10 scroll-mt-28">
        <TrustBar />
      </div>
      <Faq items={siteFaq} className="max-w-3xl py-14" />
      <section aria-labelledby="contact" className="max-w-3xl rounded-lg border border-border bg-surface p-6">
        <h2 id="contact" className="text-h3">
          Nous contacter
        </h2>
        <p className="mt-2 text-muted">
          Par e-mail :{" "}
          <a href={`mailto:${siteConfig.contact.email}`} className="text-accent underline-offset-4 hover:underline">
            {siteConfig.contact.email}
          </a>
        </p>
      </section>
    </Container>
  );
}
