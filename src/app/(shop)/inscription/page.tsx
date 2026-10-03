import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSessionUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Créer un compte",
  description: "Créez votre compte ElectroMarket.",
  path: "/inscription",
  noindex: true,
});

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/compte");
  return (
    <AuthShell
      title="Créer un compte"
      intro="Enregistrez vos informations et adresses de livraison pour commander plus vite."
      path="/inscription"
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-accent underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <SignUpForm />
      <p className="mt-4 text-xs text-muted">
        Vos données servent uniquement à gérer votre compte et vos livraisons. Vous pouvez supprimer votre compte à tout
        moment depuis votre espace client.
      </p>
    </AuthShell>
  );
}
