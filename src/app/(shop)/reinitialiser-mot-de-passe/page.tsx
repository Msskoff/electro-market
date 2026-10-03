import { NewPasswordForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Nouveau mot de passe",
  description: "Choisissez un nouveau mot de passe.",
  path: "/reinitialiser-mot-de-passe",
  noindex: true,
});

/** Accessible après le lien « mot de passe oublié » (session ouverte par /auth/callback) ou une fois connecté. */
export default async function ResetPasswordPage() {
  await requireUser("/reinitialiser-mot-de-passe");
  return (
    <AuthShell title="Nouveau mot de passe" intro="Choisissez un mot de passe d'au moins 8 caractères." path="/reinitialiser-mot-de-passe">
      <NewPasswordForm />
    </AuthShell>
  );
}
