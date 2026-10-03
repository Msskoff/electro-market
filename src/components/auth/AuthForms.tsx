"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/forms/Field";
import { FormAlert } from "@/components/forms/FormAlert";
import { PasswordField } from "@/components/forms/PasswordField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/schema";

const initial: FormState = {};

export function SignInForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action] = useActionState(signIn, initial);
  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="suite" value={next} />
      <FormAlert ok={!state.message && !!notice} message={state.message ?? notice} />
      <Field name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
      <PasswordField name="password" label="Mot de passe" autoComplete="current-password" error={state.errors?.password} />
      <p className="text-right text-sm">
        <Link href="/mot-de-passe-oublie" className="font-medium text-accent underline-offset-4 hover:underline">
          Mot de passe oublié ?
        </Link>
      </p>
      <SubmitButton fullWidth pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUp, initial);
  if (state.ok) return <FormAlert ok message={state.message} />;
  return (
    <form action={action} noValidate className="space-y-4">
      <FormAlert message={state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="firstName" label="Prénom" autoComplete="given-name" required defaultValue={state.values?.firstName} error={state.errors?.firstName} />
        <Field name="lastName" label="Nom" autoComplete="family-name" required defaultValue={state.values?.lastName} error={state.errors?.lastName} />
      </div>
      <Field name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
      <PasswordField name="password" label="Mot de passe" autoComplete="new-password" hint="8 caractères minimum." error={state.errors?.password} />
      <SubmitButton fullWidth pendingLabel="Création du compte…">
        Créer mon compte
      </SubmitButton>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  if (state.ok) return <FormAlert ok message={state.message} />;
  return (
    <form action={action} noValidate className="space-y-4">
      <FormAlert message={state.message} />
      <Field name="email" label="E-mail du compte" type="email" inputMode="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
      <SubmitButton fullWidth pendingLabel="Envoi…">
        Recevoir un lien de réinitialisation
      </SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, initial);
  return (
    <form action={action} noValidate className="space-y-4">
      <FormAlert message={state.message} />
      <PasswordField name="password" label="Nouveau mot de passe" autoComplete="new-password" hint="8 caractères minimum." error={state.errors?.password} />
      <PasswordField name="confirm" label="Confirmez le mot de passe" autoComplete="new-password" error={state.errors?.confirm} />
      <SubmitButton fullWidth pendingLabel="Enregistrement…">
        Enregistrer le nouveau mot de passe
      </SubmitButton>
    </form>
  );
}
