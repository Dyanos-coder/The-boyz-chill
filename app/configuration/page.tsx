import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Configuration" };

export default function ConfigurationPage() {
  if (isSupabaseConfigured) redirect("/");

  return (
    <main className="shell page" style={{ paddingTop: 32 }}>
      <Logo size="1.5rem" />
      <h1 className="page-title">Il manque la base de données</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          Le site a besoin d&apos;un projet Supabase. Crée le fichier <code>.env.local</code> à la racine du projet avec :
        </p>
        <pre style={{ margin: 0, padding: 16, overflowX: "auto", borderRadius: 14, background: "var(--bz-surface-2)", fontFamily: "var(--bz-font-mono)", fontSize: 12 }}>
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx`}
        </pre>
        <p style={{ margin: 0, fontSize: "var(--bz-fs-sm)", color: "var(--bz-ink-soft)" }}>
          Les deux valeurs sont dans Supabase, Project Settings, API Keys. Relance ensuite <code>pnpm dev</code>. Le détail est
          dans le README.
        </p>
      </div>
    </main>
  );
}
