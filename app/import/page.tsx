import Link from "next/link";
import ImportForm from "@/components/form-builder/ImportForm";
import Logo from "@/components/ui/Logo";

export const dynamic = "force-dynamic";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <Logo href="/dashboard" />
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">Dashboard</Link>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white">Import a Google Form</h1>
      <p className="mt-2 text-sm text-slate-400">
        Paste your form&apos;s share link. We read its questions, people answer them by voice, and their answers
        are filled into your Google Form automatically.
      </p>
      <ImportForm initialUrl={url ?? ""} />
    </main>
  );
}
