import Link from "next/link";
import { Mic, ArrowRight, Check, FileText, BarChart3, Database } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between">
      {/* Navigation */}
      <header className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between border-b border-white/[0.06]">
        <Logo size={32} showTagline={false} />

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login?tab=signup"
            className="btn-primary text-xs sm:text-sm py-1.5 px-3.5 flex items-center gap-1.5"
          >
            <span>Get started</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-400 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>Speech-to-form automation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#ededed] max-w-3xl mx-auto leading-tight">
          Forms people complete by speaking.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Respondents talk naturally instead of typing on mobile. VoiceForm transcribes speech and extracts structured data in real time.
        </p>

        <form action="/import" method="get" className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
          <input
            name="url"
            type="url"
            required
            aria-label="Google Form link"
            placeholder="Paste your Google Form link…"
            className="input flex-1"
          />
          <button className="btn-primary px-5 py-2.5 text-sm flex items-center justify-center gap-2">
            <span>Import form</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-3 text-xs text-zinc-500">
          Respondents answer by voice. Answers are filled into your Google Form.{" "}
          <Link href="/dashboard" className="underline hover:text-zinc-300">Open dashboard</Link>
        </p>

        {/* Minimalist Product Preview */}
        <div className="mt-14 max-w-3xl mx-auto rounded-xl border border-white/[0.08] bg-[#121316] p-6 text-left shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Audio Recording Flow */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Question 2 of 4</span>
                <span className="text-zinc-500">Audio Input</span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-200">
                  What was your main objective for this project?
                </h3>
              </div>

              <div className="rounded-lg bg-zinc-900/90 p-3.5 border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Mic className="h-3.5 w-3.5 text-blue-400" />
                  <span>Transcription</span>
                </div>
                <p className="text-xs text-zinc-300 italic leading-relaxed">
                  &ldquo;We wanted to automate customer feedback collection so our support team doesn&apos;t spend hours copying survey notes.&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1 text-zinc-400">
                  <Check className="h-3.5 w-3.5 text-blue-500" />
                  Auto-transcribed
                </span>
                <span>•</span>
                <span>Structured in 800ms</span>
              </div>
            </div>

            {/* Extracted JSON Schema Preview */}
            <div className="md:col-span-5 rounded-lg bg-zinc-950/80 p-4 border border-white/[0.06] font-mono text-[11px] text-zinc-400 space-y-1.5">
              <div className="text-zinc-500 font-sans text-xs pb-1 border-b border-white/[0.05] flex items-center justify-between">
                <span>Database Record</span>
                <span className="font-mono text-[10px] text-zinc-500">JSON</span>
              </div>
              <p className="text-zinc-500">&#123;</p>
              <p className="pl-3">
                <span className="text-zinc-300">&quot;objective&quot;</span>: <span className="text-blue-400">&quot;Automation&quot;</span>,
              </p>
              <p className="pl-3">
                <span className="text-zinc-300">&quot;target_team&quot;</span>: <span className="text-zinc-300">&quot;Support&quot;</span>,
              </p>
              <p className="pl-3">
                <span className="text-zinc-300">&quot;time_saved&quot;</span>: <span className="text-zinc-300">&quot;Hours/week&quot;</span>
              </p>
              <p className="text-zinc-500">&#125;</p>
            </div>

          </div>
        </div>
      </section>

      {/* Clean Feature Grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="h-9 w-9 rounded-lg bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center text-zinc-300 mb-3.5">
              <Mic className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">Conversational Voice Input</h3>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              Respondents speak comfortably. Whisper speech recognition processes audio in real time with high accuracy.
            </p>
          </div>

          <div className="card">
            <div className="h-9 w-9 rounded-lg bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center text-zinc-300 mb-3.5">
              <Database className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">Structured Extraction</h3>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              Long unstructured sentences are converted into clean, validated fields matching your question schemas.
            </p>
          </div>

          <div className="card">
            <div className="h-9 w-9 rounded-lg bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center text-zinc-300 mb-3.5">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">Real-Time Dashboard</h3>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              Review completed submissions in tabular view, manage publish links, and export data with zero friction.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-xs text-zinc-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} VoiceForm. Minimalist voice form infrastructure.</p>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-zinc-300">Sign in</Link>
            <Link href="/login?tab=signup" className="hover:text-zinc-300">Create account</Link>
            <Link href="/dashboard" className="hover:text-zinc-300">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
