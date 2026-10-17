import { notFound } from "next/navigation";
import RespondentFlow from "@/components/response-preview/RespondentFlow";
import { getPublicForm } from "@/lib/forms";
import Logo from "@/components/ui/Logo";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = /^[a-z0-9]{4,32}$/.test(slug) ? await getPublicForm(slug) : null;
  if (!form) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="mb-4 flex justify-center"><Logo size={32} /></div>
        <h1 className="text-lg font-semibold text-slate-700">{form.title}</h1>
        {form.description && <p className="mt-1 text-sm text-slate-500">{form.description}</p>}
      </header>
      <RespondentFlow form={form} />
    </main>
  );
}
