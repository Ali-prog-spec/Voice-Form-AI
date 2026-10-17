import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="VoiceForm AI" width={120} height={120} className="mb-6 rounded-2xl" />
      <h1 className="text-4xl font-bold tracking-tight">VoiceForm AI</h1>
      <p className="mt-4 text-lg text-slate-600">
        Forms people answer by speaking. Speech becomes clean, structured answers — automatically.
      </p>
      <Link href="/dashboard" className="btn-primary mt-8">Open dashboard</Link>
    </main>
  );
}
