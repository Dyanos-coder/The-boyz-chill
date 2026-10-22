"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

const SUITE_COOKIE = "bz_suite";

export type AuthMode = "connexion" | "inscription" | "oubli";
export type AuthState = { mode: AuthMode; email?: string; error?: string; info?: string; suite?: string };

async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** Page où revenir après un lien d'e-mail (confirmation, mot de passe oublié). */
async function rememberSuite(suite: string) {
  (await cookies()).set(SUITE_COOKIE, suite, { maxAge: 60 * 60, httpOnly: true, sameSite: "lax", path: "/" });
}

const emailSchema = z.email({ error: "Cette adresse e-mail n'a pas l'air valide." });
const passwordSchema = z
  .string()
  .min(8, { error: "Le mot de passe doit faire au moins 8 caractères." })
  .max(72, { error: "72 caractères maximum pour le mot de passe." });

// Supabase limite l'envoi d'e-mails de son service intégré (quelques-uns par heure pour tout le projet).
const EMAIL_LIMIT_MESSAGE =
  "Le site a atteint sa limite d'e-mails pour l'heure. Réessaie dans une heure, ou demande à l'admin du site de régler l'envoi d'e-mails.";

const readEmail = (fd: FormData) => String(fd.get("email") ?? "").trim().toLowerCase();

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const suite = safeNext(formData.get("suite"));
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { mode: "connexion", email, suite, error: "Remplis ton e-mail et ton mot de passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Ton adresse n'est pas encore confirmée. Clique sur le lien reçu par e-mail à l'inscription."
        : error.status === 429
          ? "Trop d'essais d'affilée. Attends une minute."
          : "E-mail ou mot de passe incorrect.";
    return { mode: "connexion", email, suite, error: message };
  }
  redirect(suite);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const suite = safeNext(formData.get("suite"));
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) return { mode: "inscription", email, suite, error: parsedEmail.error.issues[0].message };
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) return { mode: "inscription", email, suite, error: parsedPassword.error.issues[0].message };
  if (password !== confirm) return { mode: "inscription", email, suite, error: "Les deux mots de passe ne sont pas identiques." };

  const supabase = await createClient();
  await rememberSuite(suite);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await getOrigin()}/auth/callback` },
  });

  if (error) {
    const message =
      error.code === "user_already_exists"
        ? "Un compte existe déjà avec cet e-mail. Connecte-toi."
        : error.code === "weak_password"
          ? "Mot de passe trop simple. Mélange lettres et chiffres."
          : error.code === "over_email_send_rate_limit"
            ? EMAIL_LIMIT_MESSAGE
            : error.status === 429
              ? "Trop d'inscriptions d'affilée. Attends quelques minutes."
              : "L'inscription n'est pas passée, réessaie.";
    return { mode: error.code === "user_already_exists" ? "connexion" : "inscription", email, suite, error: message };
  }

  // Confirmation d'e-mail désactivée dans Supabase : la session est ouverte tout de suite.
  if (data.session) redirect(suite);

  // Compte existant (Supabase ne le dit pas, pour ne pas révéler les adresses inscrites).
  if (data.user && data.user.identities?.length === 0) {
    return { mode: "connexion", email, suite, error: "Un compte existe déjà avec cet e-mail. Connecte-toi." };
  }

  return {
    mode: "connexion",
    email,
    suite,
    info: `Compte créé. Clique sur le lien envoyé à ${email} pour confirmer ton adresse, puis connecte-toi.`,
  };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = readEmail(formData);
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { mode: "oubli", email, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  await rememberSuite("/mot-de-passe");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getOrigin()}/auth/callback`,
  });
  if (error?.status === 429) {
    const message =
      error.code === "over_email_send_rate_limit" ? EMAIL_LIMIT_MESSAGE : "Trop de demandes d'affilée. Attends quelques minutes.";
    return { mode: "oubli", email, error: message };
  }

  // Même réponse que l'adresse existe ou non.
  return {
    mode: "connexion",
    email,
    info: `Si un compte existe pour ${email}, un lien pour choisir un nouveau mot de passe vient d'y être envoyé.`,
  };
}

export type PasswordState = { error?: string; saved?: boolean };

export async function updatePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (password !== String(formData.get("password_confirm") ?? "")) {
    return { error: "Les deux mots de passe ne sont pas identiques." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "C'est déjà ton mot de passe actuel."
          : error.code === "weak_password"
            ? "Mot de passe trop simple. Mélange lettres et chiffres."
            : "Le changement n'est pas passé. Reconnecte-toi et réessaie.",
    };
  }
  return { saved: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
