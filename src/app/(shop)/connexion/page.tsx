import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { ButtonLink } from "@/components/ui/Button";
import { safeNextPath } from "@/lib/auth/redirect";
import { getSessionUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Connexion",
  description: "Connectez-vous à votre compte ElectroMarket.",
  path: "/connexion",
  noindex: true,
});

const NOTICES: Record<string, string> = {
  lien: "Ce lien a expiré ou a déjà été utilisé. Connectez-vous, ou demandez un nouveau lien.",
};

export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = safeNextPath(Array.isArray(params.suite) ? params.suite[0] : params.suite);
  if (await getSessionUser()) redirect(next);
  const erreur = Array.isArray(params.erreur) ? params.erreur[0] : params.erreur;
  const checkout = next.startsWith("/commande");
  const signUpHref = `/inscription?suite=${encodeURIComponent(next)}`;

  return (
    <AuthShell
      title={checkout ? "Plus qu'une étape" : "Connexion"}
      intro={
        checkout
          ? "Connectez-vous pour finaliser votre commande. Votre panier est conservé."
          : "Retrouvez votre profil, vos adresses de livraison et vos commandes."
      }
      path="/connexion"
      before={checkout ? <CheckoutSteps current={1} /> : undefined}
      crumbs={checkout ? [{ name: "Panier", path: "/panier" }, { name: "Identification", path: "/connexion" }] : undefined}
      footer={
        checkout ? undefined : (
          <>
            Pas encore de compte ?{" "}
            <Link href={signUpHref} className="font-semibold text-accent underline-offset-4 hover:underline">
              Créer un compte
            </Link>
          </>
        )
      }
    >
      {checkout && <h2 className="mb-4 font-sans text-base font-semibold tracking-normal">J&apos;ai déjà un compte</h2>}
      <SignInForm next={next} notice={erreur ? NOTICES[erreur] : undefined} />
      {checkout && (
        <div className="mt-6 border-t border-border pt-6">
          <h2 className="font-sans text-base font-semibold tracking-normal">Je suis nouveau client</h2>
          <p className="mt-1 text-sm text-muted">Créez votre compte en moins d&apos;une minute, puis terminez votre commande.</p>
          <ButtonLink href={signUpHref} variant="secondary" fullWidth className="mt-4">
            Créer mon compte
          </ButtonLink>
        </div>
      )}
    </AuthShell>
  );
}
