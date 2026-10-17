import Link from "next/link";
import { notFound } from "next/navigation";
import FormBuilder from "@/components/form-builder/FormBuilder";
import Logo from "@/components/ui/Logo";
import { CopyLinkButton } from "@/components/ui/DashboardActions";
import { QUESTION_TYPE_LABELS } from "@/types";
import { getFormWithQuestions } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const data = await getFormWithQuestions(await createClient(), id);
  if (!data) notFound();

  if (data.form.source === "google") {
    const { form, questions } = data;
    return (
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6"><Logo href="/dashboard" /></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Imported from Google Forms</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{form.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {form.public_slug && (
            <>
              <Link href={`/f/${form.public_slug}`} target="_blank" className="btn-primary">Open voice form</Link>
              <CopyLinkButton slug={form.public_slug} />
            </>
          )}
          <Link href={`/forms/${form.id}/responses`} className="btn-secondary">Responses</Link>
          <Link href="/import" className="btn-secondary">Import another</Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Questions are synced from your Google Form. To change them, edit the form in Google and import it again.
        </p>
        <ol className="mt-6 space-y-3">
          {questions.map((q, i) => (
            <li key={q.id} className="card">
              <p className="text-xs text-slate-500">
                {i + 1} · {QUESTION_TYPE_LABELS[q.question_type]}
                {q.is_required ? " · required" : ""}
              </p>
              <p className="mt-1 font-medium text-white">{q.question_text}</p>
              {q.options && <p className="mt-1 text-sm text-slate-400">{q.options.join(" · ")}</p>}
            </li>
          ))}
        </ol>
      </main>
    );
  }

  return <FormBuilder form={data.form} questions={data.questions} />;
}
