import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

// Arrivée depuis un lien d'e-mail (confirmation d'inscription, mot de passe oublié).
// - ?token_hash=…&type=email|recovery : modèles d'e-mail du projet (marche dans n'importe quel navigateur)
// - ?code=… : modèles par défaut de Supabase (marche seulement dans le navigateur qui a demandé l'e-mail)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  // Lien « mot de passe oublié » : on va toujours choisir le nouveau mot de passe.
  const suite =
    type === "recovery" ? "/mot-de-passe" : safeNext(searchParams.get("suite") ?? request.cookies.get("bz_suite")?.value);

  const supabase = await createClient();

  let ok = false;
  if (tokenHash) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const target = ok ? suite : `/connexion?erreur=lien&suite=${encodeURIComponent(suite)}`;
  const response = NextResponse.redirect(new URL(target, request.url));
  if (ok) response.cookies.delete("bz_suite");
  return response;
}
