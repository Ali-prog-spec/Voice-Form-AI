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
    <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-10">
      {/* Top Bar with Logo & Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
        <Logo href="/dashboard" showTagline={true} />
        <SignOutButton />
      </div>

      {/* Header with Title, Email & Create Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Your Voice Forms</h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Signed in as <span className="text-slate-200 font-medium">{user.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DemoButton />
          <Link href="/forms/new" className="btn-primary text-sm flex items-center gap-1.5 shadow-glow-sm">
            <Plus className="h-4 w-4" />
            <span>New form</span>
          </Link>
        </div>
      </header>

      {/* Forms List or 3D Empty State */}
      {forms.length === 0 ? (
        <div className="card text-center py-16 px-6 border-dashed border-white/[0.15]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-glow-sm">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-white">No voice forms yet</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Create your first intelligent voice-enabled form or generate a demo form to experience real-time speech answers.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <DemoButton />
            <Link href="/forms/new" className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Create new form</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((f) => {
            const count = f.sessions.filter((s) => s.status === "completed").length;
            return (
              <div
                key={f.id}
                className="card flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:border-indigo-500/40 transition-all duration-200"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-lg text-white tracking-tight">{f.title || "Untitled Form"}</h3>
                    {f.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="h-3 w-3" /> Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-3">
                    <span>
                      <strong className="text-slate-200 font-semibold">{count}</strong> completed response{count === 1 ? "" : "s"}
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
                        className="btn-secondary text-xs flex items-center gap-1 text-sky-300 border-sky-500/20 hover:border-sky-500/40"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open Form</span>
                      </Link>
                      <CopyLinkButton slug={f.public_slug} />
                    </>
                  )}
                  <Link
                    href={`/forms/${f.id}/responses`}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
                    <span>Responses</span>
                  </Link>
                  <Link
                    href={`/forms/${f.id}`}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-400" />
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
