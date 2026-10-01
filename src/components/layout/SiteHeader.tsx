import { kindIcon } from "@/components/product/kindIcon";
import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { getCategories } from "@/lib/catalog/repository";
import { categoryPath } from "@/lib/catalog/selectors";
import { t } from "@/lib/i18n/fr";
import { CartLink } from "./CartLink";
import { CategoryMenu } from "./CategoryMenu";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { SearchForm } from "./SearchForm";

const { policies } = siteConfig;

const topBarItems: { icon: IconName; text: string }[] = [
  { icon: "truck", text: `Livraison ${policies.shippingDelay}` },
  { icon: "rotate", text: `Retours sous ${policies.returnDays} jours` },
  { icon: "lock", text: "Paiement sécurisé" },
];

export async function SiteHeader() {
  const categories = await getCategories();
  const menuItems = [
    ...categories.map((c) => ({ href: categoryPath(c.slug), label: c.name, icon: kindIcon[c.kind] })),
    { href: "/guides", label: t.nav.guides, icon: "book" as const },
  ];

  return (
    <>
      {/* Bandeau de réassurance */}
      <div className="bg-inverse text-on-inverse">
        <Container className="flex h-8 items-center justify-center gap-6 text-xs font-medium sm:h-9">
          {siteConfig.demoMode && (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-on-inverse/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.06em]">
              <span className="sm:hidden">Démo</span>
              <span className="hidden sm:inline">Démo — produits fictifs</span>
            </span>
          )}
          <ul className="flex items-center gap-6">
            {topBarItems.map((item, i) => (
              <li key={item.text} className={i === 0 ? "flex items-center gap-2 whitespace-nowrap" : "hidden items-center gap-2 whitespace-nowrap md:flex"}>
                <Icon name={item.icon} size={15} className="text-on-inverse-muted" />
                {item.text}
              </li>
            ))}
          </ul>
        </Container>
      </div>

      <header className="z-40 border-b border-border bg-bg/90 backdrop-blur-md md:sticky md:top-0">
        <Container className="flex h-16 items-center justify-between gap-6 md:h-20">
          <Logo />
          <SearchForm className="hidden max-w-xl flex-1 md:block" />
          <div className="flex items-center gap-1">
            <CartLink />
          </div>
        </Container>

        <Container className="pb-3 md:hidden">
          <SearchForm />
        </Container>

        <div className="border-t border-border">
          <Container className="flex items-center gap-8">
            <div className="hidden py-2 lg:block">
              <CategoryMenu items={menuItems} />
            </div>
            <nav aria-label={t.nav.mainNav} className="min-w-0 flex-1">
              <ul className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 lg:mx-0 lg:gap-8 lg:px-0">
                <li className="shrink-0">
                  <NavLink href="/">{t.nav.home}</NavLink>
                </li>
                {categories.map((c) => (
                  <li key={c.slug} className="shrink-0">
                    <NavLink href={categoryPath(c.slug)}>{c.name}</NavLink>
                  </li>
                ))}
                <li className="shrink-0">
                  <NavLink href="/guides">{t.nav.guides}</NavLink>
                </li>
                <li className="shrink-0">
                  <NavLink href="/faq">{t.nav.faq}</NavLink>
                </li>
              </ul>
            </nav>
          </Container>
        </div>
      </header>
    </>
  );
}
