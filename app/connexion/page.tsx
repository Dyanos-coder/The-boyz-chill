import type { Metadata } from "next";
import { safeNext } from "@/lib/safe-next";
import { Logo } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const suite = safeNext(typeof params.suite === "string" ? params.suite : "/");
  const linkError = params.erreur === "lien";

  return (
    <main className="shell" style={{ minHeight: "100dvh", display: "grid", alignContent: "center", paddingBlock: 32 }}>
      <div className="auth-ticket-wrap">
        <div className="auth-ticket notched">
          <div className="auth-ticket__main">
            <Logo size="clamp(2.75rem, 14vw, 4rem)" />
            <p className="auth-ticket__lede">Les plans des boyz, au même endroit.</p>
            {linkError && (
              <p className="form-error" role="alert">
                Ce lien a expiré ou a déjà servi. Connecte-toi, ou redemande un lien avec « Mot de passe oublié ».
              </p>
            )}
            <LoginForm suite={suite} />
          </div>
          <div className="auth-ticket__stub" aria-hidden="true">
            <span>Entrée · The Boyz</span>
          </div>
        </div>
      </div>
    </main>
  );
}
