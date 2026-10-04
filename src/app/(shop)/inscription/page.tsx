import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { safeNextPath } from "@/lib/auth/redirect";
import { getSessionUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Créer un compte",
  description: "Créez votre compte ElectronikTogo.",
  path: "/inscription",
  noindex: true,
});

export default async function SignUpPage({ searchParams }: PageProps<"/inscription">) {
  const params = await searchParams;
  const next = safeNextPath(Array.isArray(params.suite) ? params.suite[0] : params.suite);
  if (await getSessionUser()) redirect(next);
  const checkout = next.startsWith("/commande");

  return (
    <AuthShell
      title="Créer mon compte"
      intro={
        checkout
          ? "Votre panier est conservé : vous retrouverez votre commande juste après."
          : "Enregistrez vos informations et adresses de livraison pour commander plus vite."
      }
      path="/inscription"
      before={checkout ? <CheckoutSteps current={1} /> : undefined}
      crumbs={checkout ? [{ name: "Panier", path: "/panier" }, { name: "Identification", path: "/inscription" }] : undefined}
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href={`/connexion?suite=${encodeURIComponent(next)}`} className="font-semibold text-accent underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <SignUpForm next={next} />
      <p className="mt-4 text-xs text-muted">
        Vos données servent uniquement à gérer votre compte et vos livraisons. Vous pouvez supprimer votre compte à tout
        moment depuis votre espace client.
      </p>
    </AuthShell>
  );
}
