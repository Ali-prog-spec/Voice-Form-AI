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
    <main className="relative z-10 mx-auto min-h-screen max-w-xl px-4 py-12 flex flex-col justify-center">
      <header className="mb-8 text-center">
        <div className="mb-5 flex justify-center">
          <Logo size={44} showTagline={true} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{form.title}</h1>
        {form.description && (
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">{form.description}</p>
        )}
      </header>
      <div className="relative">
        <RespondentFlow form={form} />
      </div>
    </main>
  );
}
