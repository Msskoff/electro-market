import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getGuides } from "@/lib/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDate } from "@/lib/utils/format";

export const metadata = buildMetadata({
  title: "Guides d'achat high-tech",
  description:
    "Nos guides pour bien choisir smartphone, ordinateur portable, casque ou montre connectée : critères essentiels, repères par usage et réponses aux questions fréquentes.",
  path: "/guides",
});

export default function GuidesPage() {
  const guides = getGuides();
  return (
    <Container>
      <Breadcrumbs items={[{ name: "Guides d'achat", path: "/guides" }]} />
      <SectionHeading
        as="h1"
        eyebrow={`${guides.length} guides`}
        title="Guides d'achat"
        description="Des méthodes de choix claires et datées, sans jargon inutile."
        className="border-b border-border pb-10"
      />
      <ul className="grid gap-5 py-10 md:grid-cols-2">
        {guides.map((g) => (
          <li key={g.slug}>
            <article className="relative h-full rounded-lg border border-border bg-surface p-6 transition-colors hover:border-border-strong">
              <p className="label-mono text-muted">Mis à jour le {formatDate(g.updatedAt)}</p>
              <h2 className="mt-3 text-h3">
                <Link href={`/guides/${g.slug}`} className="after:absolute after:inset-0">
                  {g.title}
                </Link>
              </h2>
              <p className="mt-2 text-muted">{g.description}</p>
            </article>
          </li>
        ))}
      </ul>
    </Container>
  );
}
