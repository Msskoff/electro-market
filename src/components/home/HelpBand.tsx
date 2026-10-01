import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";

/**
 * Encart « conseil » (à la place d'une inscription newsletter tant
 * qu'aucun service d'e-mailing n'est branché).
 */
export function HelpBand() {
  return (
    <section
      aria-labelledby="conseil-title"
      className="grid items-center gap-8 overflow-hidden rounded-xl bg-inverse px-6 py-10 text-on-inverse sm:px-10 md:grid-cols-[auto_1fr_auto]"
    >
      <span className="hidden size-20 items-center justify-center rounded-full bg-on-inverse text-inverse md:flex">
        <Icon name="chat" size={34} strokeWidth={1.25} />
      </span>
      <div>
        <h2 id="conseil-title" className="text-h2">
          Besoin d&apos;un conseil avant d&apos;acheter ?
        </h2>
        <p className="mt-2 max-w-xl text-on-inverse-muted">
          Nos guides comparent les critères qui comptent vraiment. Une question précise sur un
          appareil ? Écrivez-nous.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/guides"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-tile-sage px-6 text-sm font-semibold text-accent transition-opacity hover:opacity-90"
        >
          Lire les guides
          <Icon name="arrowRight" size={16} />
        </Link>
        <a
          href={`mailto:${siteConfig.contact.email}`}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-on-inverse/30 px-6 text-sm font-semibold transition-colors hover:bg-on-inverse/10"
        >
          <Icon name="mail" size={16} />
          Nous écrire
        </a>
      </div>
    </section>
  );
}
