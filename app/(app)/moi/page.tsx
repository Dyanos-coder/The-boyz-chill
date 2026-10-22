import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { requireMember } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Moi" };

export default async function MoiPage() {
  const { profile, email } = await requireMember();

  return (
    <>
      <h1 className="page-title">Moi</h1>

      <section className="card">
        <span className="section-label">Profil</span>
        <ProfileForm pseudo={profile.pseudo} color={profile.color} submitLabel="Enregistrer" />
      </section>

      <section className="card">
        <span className="section-label">Affichage</span>
        <ThemeToggle />
      </section>

      <section className="card">
        <span className="section-label">Compte</span>
        <p style={{ margin: 0, fontSize: "var(--bz-fs-sm)", color: "var(--bz-ink-soft)" }}>Connecté avec {email}</p>
        <form action={signOut}>
          <button className="btn btn--danger" type="submit">
            <LogOut className="i" aria-hidden="true" />
            Me déconnecter
          </button>
        </form>
      </section>
    </>
  );
}
