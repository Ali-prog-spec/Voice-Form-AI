import Link from "next/link";
import { notFound } from "next/navigation";
import ResponsesTable from "@/components/response-preview/ResponsesTable";
import { getFormWithQuestions, getResponsesData } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const supabase = await createClient();
  const data = await getFormWithQuestions(supabase, id);
  if (!data) notFound();
  const sessions = await getResponsesData(supabase, id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">← Dashboard</Link>
      <h1 className="mt-2 text-2xl font-bold">{data.form.title}</h1>
      <p className="text-sm text-slate-500">{sessions.length} completed response{sessions.length === 1 ? "" : "s"}</p>
      <ResponsesTable questions={data.questions} sessions={sessions} />
    </main>
  );
}
