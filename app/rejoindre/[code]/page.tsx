import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/data";
import { Logo } from "@/components/ui";
import { JoinGroupForm } from "../group-forms";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitePage({ params }: PageProps<"/rejoindre/[code]">) {
  const { code } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc("invite_preview", { code });
  const group = (data as { name: string; members: number }[] | null)?.[0];

  return (
    <main className="shell page" style={{ paddingTop: 32, maxWidth: 520 }}>
      <Logo size="1.5rem" />
      {group ? (
        <>
          <h1 className="page-title">Tu es invité dans {group.name}</h1>
          <p style={{ margin: 0, color: "var(--bz-ink-soft)" }}>
            {group.members} membre{group.members > 1 ? "s" : ""} t&apos;attend{group.members > 1 ? "ent" : ""} déjà.
          </p>
          <div className="card">
            <JoinGroupForm code={code} />
          </div>
        </>
      ) : (
        <>
          <h1 className="page-title">Cette invitation ne marche pas</h1>
          <p style={{ margin: 0, color: "var(--bz-ink-soft)" }}>
            Le lien est peut-être incomplet. Redemande-le à un membre du groupe.
          </p>
          <Link className="btn btn--outline" href="/rejoindre" style={{ justifySelf: "start" }}>
            Entrer un code à la main
          </Link>
        </>
      )}
    </main>
  );
}
