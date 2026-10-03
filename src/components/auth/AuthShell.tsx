import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/ui/Container";

/** Mise en page des pages d'authentification : carte centrée, fil d'Ariane, liens utiles. */
export function AuthShell({
  title,
  intro,
  path,
  children,
  footer,
}: {
  title: string;
  intro?: string;
  path: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Container className="pb-12">
      <Breadcrumbs items={[{ name: title, path }]} />
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-8">
          <h1 className="text-h2">{title}</h1>
          {intro && <p className="mt-2 text-muted">{intro}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </Container>
  );
}
