import type { Metadata } from "next";
import { requireUser } from "@/lib/data";
import { Logo } from "@/components/ui";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Mot de passe" };

// Page d'arrivée du lien « mot de passe oublié », aussi accessible depuis « Moi ».
export default async function MotDePassePage() {
  await requireUser();

  return (
    <main className="shell page" style={{ paddingTop: 32, maxWidth: 520 }}>
      <Logo size="1.5rem" />
      <h1 className="page-title">Nouveau mot de passe</h1>
      <div className="card">
        <PasswordForm />
      </div>
    </main>
  );
}
