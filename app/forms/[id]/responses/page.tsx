import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Users } from "lucide-react";
import ResponsesTable from "@/components/response-preview/ResponsesTable";
import { getFormWithQuestions, getResponsesData } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";
import Logo from "@/components/ui/Logo";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const supabase = await createClient();
  const data = await getFormWithQuestions(supabase, id);
  if (!data) notFound();
  const sessions = await getResponsesData(supabase, id);

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
        <Logo href="/dashboard" showTagline={true} />
        <Link
          href="/dashboard"
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>Response Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{data.form.title}</h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span>
              <strong className="text-slate-200 font-semibold">{sessions.length}</strong> completed response{sessions.length === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>

      <ResponsesTable questions={data.questions} sessions={sessions} />
    </main>
  );
}
