"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export type AuthState = { step: "email" | "code"; email?: string; error?: string; suite?: string };

async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

const emailSchema = z.email({ error: "Cette adresse e-mail n'a pas l'air valide." });

export async function sendLoginEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const suite = safeNext(formData.get("suite"));
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { step: "email", error: parsed.error.issues[0].message, suite };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?suite=${encodeURIComponent(suite)}`,
    },
  });

  if (error) {
    const tooMany = error.status === 429;
    return {
      step: "email",
      suite,
      error: tooMany
        ? "Trop de demandes d'affilée. Attends une minute avant de redemander un lien."
        : "L'e-mail n'est pas parti. Vérifie l'adresse et réessaie.",
    };
  }
  return { step: "code", email: parsed.data, suite };
}

export async function verifyLoginCode(prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const suite = safeNext(formData.get("suite"));
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");

  if (!/^\d{6,10}$/.test(token)) {
    return { step: "code", email, suite, error: "Le code reçu par e-mail contient uniquement des chiffres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { step: "code", email, suite, error: "Ce code ne marche pas ou a expiré. Redemande un e-mail." };
  }
  redirect(suite);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
