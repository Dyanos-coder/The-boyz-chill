import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyGroup, requireUser } from "@/lib/data";
import { Logo } from "@/components/ui";
import { CreateGroupForm, JoinGroupForm } from "./group-forms";

export const metadata: Metadata = { title: "Rejoindre le groupe" };

export default async function RejoindrePage() {
  await requireUser();
  if (await getMyGroup()) redirect("/");

  return (
    <main className="shell page" style={{ paddingTop: 32, maxWidth: 520 }}>
      <Logo size="1.5rem" />
      <h1 className="page-title">Rejoins les boyz</h1>
      <div className="card">
        <h2 className="sub" style={{ margin: 0, fontWeight: 700 }}>
          J&apos;ai un lien ou un code
        </h2>
        <JoinGroupForm />
      </div>
      <div className="card">
        <h2 className="sub" style={{ margin: 0, fontWeight: 700 }}>
          Personne n&apos;a encore créé le groupe
        </h2>
        <p style={{ margin: 0, fontSize: "var(--bz-fs-sm)", color: "var(--bz-ink-soft)" }}>
          Crée-le, tu en seras admin et tu pourras inviter les autres avec un lien.
        </p>
        <CreateGroupForm />
      </div>
    </main>
  );
}
