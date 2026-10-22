import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyProfile, requireUser } from "@/lib/data";
import { Logo } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function BienvenuePage() {
  await requireUser();
  const profile = await getMyProfile();
  if (profile?.pseudo) redirect("/");

  return (
    <main className="shell page" style={{ paddingTop: 32, maxWidth: 520 }}>
      <Logo size="1.5rem" />
      <h1 className="page-title">Bienvenue chez les boyz</h1>
      <p style={{ margin: 0, color: "var(--bz-ink-soft)" }}>Choisis ton pseudo et ta couleur. Tu pourras les changer plus tard.</p>
      <div className="card">
        <ProfileForm pseudo="" color={profile?.color ?? "chill"} suite="/" submitLabel="C'est parti" />
      </div>
    </main>
  );
}
