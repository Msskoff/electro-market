import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
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

  return (
    <AuthShell
      title="Connexion"
      intro="Retrouvez votre profil, vos adresses de livraison et vos commandes."
      path="/connexion"
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-accent underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <SignInForm next={next} notice={erreur ? NOTICES[erreur] : undefined} />
    </AuthShell>
  );
}
