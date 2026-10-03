import Link from "next/link";
import { ResetRequestForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Mot de passe oublié",
  description: "Recevez un lien pour choisir un nouveau mot de passe.",
  path: "/mot-de-passe-oublie",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      intro="Saisissez l'e-mail de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe."
      path="/mot-de-passe-oublie"
      footer={
        <Link href="/connexion" className="font-semibold text-accent underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <ResetRequestForm />
    </AuthShell>
  );
}
