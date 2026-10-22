import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Arrivée depuis le lien de l'e-mail de connexion.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const suiteParam = searchParams.get("suite") ?? "/";
  const suite = suiteParam.startsWith("/") && !suiteParam.startsWith("//") ? suiteParam : "/";

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  const target = ok ? suite : `/connexion?erreur=lien&suite=${encodeURIComponent(suite)}`;
  return NextResponse.redirect(new URL(target, request.url));
}
