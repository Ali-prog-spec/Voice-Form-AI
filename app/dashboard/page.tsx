import Link from "next/link";
import { redirect } from "next/navigation";
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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6"><Logo href="/dashboard" /></div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your forms</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DemoButton />
          <Link href="/forms/new" className="btn-primary">New form</Link>
          <SignOutButton />
        </div>
      </header>

      {forms.length === 0 ? (
        <div className="card mt-8 text-center text-slate-600">
          No forms yet. Create one, or add the demo form to try the voice flow.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {forms.map((f) => {
            const count = f.sessions.filter((s) => s.status === "completed").length;
            return (
              <li key={f.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-slate-500">
                    {f.is_published ? "Published" : "Draft"} · {count} response{count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {f.is_published && f.public_slug && (
                    <>
                      <Link href={`/f/${f.public_slug}`} target="_blank" className="btn-secondary">Open</Link>
                      <CopyLinkButton slug={f.public_slug} />
                    </>
                  )}
                  <Link href={`/forms/${f.id}/responses`} className="btn-secondary">Responses</Link>
                  <Link href={`/forms/${f.id}`} className="btn-secondary">Edit</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
