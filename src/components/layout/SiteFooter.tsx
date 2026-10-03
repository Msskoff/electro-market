import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { getCategories } from "@/lib/catalog/repository";
import { getSettings } from "@/lib/settings/repository";
import { categoryPath } from "@/lib/catalog/selectors";
import { Logo } from "./Logo";

/**
 * Colonne de liens : accordéon sur mobile (pied de page court),
 * colonne toujours ouverte à partir de 768 px.
 */
function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  const list = (className: string) => (
    <ul className={className}>
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="text-on-inverse-muted transition-colors hover:text-on-inverse">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div>
      <details className="details-smooth group border-b border-on-inverse/15 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          {title}
          <Icon name="chevronDown" size={18} className="text-on-inverse-muted transition-transform duration-200 group-open:rotate-180" />
        </summary>
        {list("space-y-3 pb-5 text-sm")}
      </details>
      <div className="hidden md:block">
        <h2 className="font-sans text-sm font-semibold tracking-normal">{title}</h2>
        {list("mt-4 space-y-2.5 text-sm")}
      </div>
    </div>
  );
}

export async function SiteFooter() {
  const [categories, { contact }] = await Promise.all([getCategories(), getSettings()]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-14 bg-inverse text-on-inverse sm:mt-20">
      <Container className="grid gap-0 py-10 md:grid-cols-2 md:gap-10 md:py-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="mb-6 max-w-xs md:mb-0">
          <Logo inverse />
          <p className="mt-5 hidden text-sm leading-relaxed text-on-inverse-muted md:block">{siteConfig.description}</p>
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
          title="Mon compte"
          links={[
            { href: "/compte", label: "Mon profil" },
            { href: "/compte#commandes", label: "Mes commandes" },
            { href: "/compte#adresses", label: "Mes adresses" },
            { href: "/panier", label: "Mon panier" },
          ]}
        />
        <FooterColumn
          title="Aide"
          links={[
            { href: "/faq", label: "Questions fréquentes" },
            { href: "/faq#livraison", label: "Livraison et retours" },
            { href: "/recherche", label: "Rechercher un produit" },
          ]}
        />
      </Container>
      <div className="border-t border-on-inverse/15">
        <Container className="flex flex-col items-start gap-2 py-5 text-xs text-on-inverse-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
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
