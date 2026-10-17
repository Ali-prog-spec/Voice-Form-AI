import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ExternalLink, BarChart3, Edit3, FileText, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/ui/Logo";
import { CopyLinkButton, DemoButton, SignOutButton } from "@/components/ui/DashboardActions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  is_published: boolean;
  public_slug: string | null;
  created_at: string;
  sessions: { status: string }[];
};

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("forms")
    .select("id,title,is_published,public_slug,created_at,sessions(status)")
    .order("created_at", { ascending: false });
  const forms = (data ?? []) as Row[];

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.06]">
        <Logo href="/dashboard" showTagline={false} />
        <SignOutButton />
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#ededed]">Forms</h1>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <DemoButton />
          <Link href="/forms/new" className="btn-secondary text-xs flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>New form</span>
          </Link>
          <Link href="/import" className="btn-primary text-xs flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Import Google Form</span>
          </Link>
        </div>
      </header>

      {/* Forms List or Empty State */}
      {forms.length === 0 ? (
        <div className="card text-center py-14 px-4 border-dashed border-white/[0.1]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 mb-3">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No forms created</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
            Get started by creating a form or loading a demo form to test speech answering.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2.5">
            <DemoButton />
            <Link href="/forms/new" className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Create form</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((f) => {
            const count = f.sessions.filter((s) => s.status === "completed").length;
            return (
              <div
                key={f.id}
                className="card flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 hover:border-white/[0.14] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-[#ededed]">{f.title || "Untitled Form"}</h3>
                    {f.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                        <Clock className="h-3 w-3" /> Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-2">
                    <span>
                      <strong className="text-zinc-300 font-medium">{count}</strong> response{count === 1 ? "" : "s"}
                    </span>
                    <span>•</span>
                    <span>Created {new Date(f.created_at).toLocaleDateString()}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {f.is_published && f.public_slug && (
                    <>
                      <Link
                        href={`/f/${f.public_slug}`}
                        target="_blank"
                        className="btn-secondary text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3 text-zinc-400" />
                        <span>Open</span>
                      </Link>
                      <CopyLinkButton slug={f.public_slug} />
                    </>
                  )}
                  <Link
                    href={`/forms/${f.id}/responses`}
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <BarChart3 className="h-3 w-3 text-zinc-400" />
                    <span>Responses</span>
                  </Link>
                  <Link
                    href={`/forms/${f.id}`}
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3 text-zinc-400" />
                    <span>Edit</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
