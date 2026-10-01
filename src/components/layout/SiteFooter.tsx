import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { getCategories } from "@/lib/catalog/repository";
import { categoryPath } from "@/lib/catalog/selectors";
import { getGuides } from "@/lib/content/guides";
import { Logo } from "./Logo";

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="font-sans text-sm font-semibold tracking-normal">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-on-inverse-muted transition-colors hover:text-on-inverse">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const categories = await getCategories();
  const guides = getGuides();
  const year = new Date().getFullYear();
  const { contact } = siteConfig;

  return (
    <footer className="mt-20 bg-inverse text-on-inverse">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo inverse />
          <p className="mt-5 text-sm leading-relaxed text-on-inverse-muted">{siteConfig.description}</p>
          <address className="mt-5 space-y-1 text-sm not-italic text-on-inverse-muted">
            <p>
              {contact.address.city}, Togo
            </p>
            <p>
              <a href={`mailto:${contact.email}`} className="hover:text-on-inverse">
                {contact.email}
              </a>
            </p>
            <p>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-on-inverse">
                {contact.phone}
              </a>
            </p>
          </address>
        </div>
        <FooterColumn
          title="Catalogue"
          links={categories.map((c) => ({ href: categoryPath(c.slug), label: c.name }))}
        />
        <FooterColumn
          title="Guides d'achat"
          links={[
            ...guides.map((g) => ({ href: `/guides/${g.slug}`, label: g.title })),
            { href: "/guides", label: "Tous les guides" },
          ]}
        />
        <FooterColumn
          title="Aide"
          links={[
            { href: "/faq", label: "Questions fréquentes" },
            { href: "/faq#livraison", label: "Livraison et retours" },
            { href: "/recherche", label: "Rechercher un produit" },
            { href: "/panier", label: "Mon panier" },
          ]}
        />
      </Container>
      <div className="border-t border-on-inverse/15">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-on-inverse-muted">
          <p>
            © {year} {siteConfig.name}. Prix TTC en francs CFA.
          </p>
          <p>Mentions légales · CGV · Confidentialité — à compléter</p>
          <p className="rounded-full border border-on-inverse/20 px-3 py-1 text-on-inverse">Togo · F CFA</p>
        </Container>
      </div>
    </footer>
  );
}
