import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { requireMember } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Moi" };

export default async function MoiPage() {
  const { profile, email, userId } = await requireMember();

  return (
    <div className="narrow">
      <h1 className="page-title">Moi</h1>

      <section className="card">
        <span className="section-label">Profil</span>
        <ProfileForm
          userId={userId}
          pseudo={profile.pseudo}
          color={profile.color}
          avatarUrl={profile.avatar_url}
          submitLabel="Enregistrer"
        />
      </section>

      <section className="card">
        <span className="section-label">Affichage</span>
        <ThemeToggle />
      </section>

      <section className="card">
        <span className="section-label">Compte</span>
        <p style={{ margin: 0, fontSize: "var(--bz-fs-sm)", color: "var(--bz-ink-soft)" }}>Connecté avec {email}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link className="btn btn--outline" href="/mot-de-passe">
            <KeyRound className="i" aria-hidden="true" />
            Changer mon mot de passe
          </Link>
          <form action={signOut}>
            <button className="btn btn--danger" type="submit">
              <LogOut className="i" aria-hidden="true" />
              Me déconnecter
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
