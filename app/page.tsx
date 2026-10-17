import Link from "next/link";
import { Mic, Sparkles, ArrowRight, Shield, Zap, CheckCircle2, ChevronRight, BarChart3, Layers } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Top Navigation */}
      <header className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <Logo size={42} showTagline={true} />
        
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login?tab=signup"
            className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 text-center">
        {/* Glowing Pill Announcement */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm font-medium text-indigo-300 mb-8 backdrop-blur-md shadow-glow-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
          <span>Next-Generation Voice-To-Form AI Engine</span>
          <ChevronRight className="h-4 w-4 text-indigo-400" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Forms people answer by{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-sky-400 bg-clip-text text-transparent">
            speaking.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
          Speech becomes clean, structured data — automatically. Boost form conversion by 4x with conversational voice input.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/login?tab=signup" className="btn-primary px-7 py-3.5 text-base shadow-glow-md flex items-center gap-2">
            <Mic className="h-5 w-5" />
            <span>Start Building for Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/dashboard" className="btn-secondary px-6 py-3.5 text-base">
            Open Creator Dashboard
          </Link>
        </div>

        {/* 3D HERO INTERACTIVE PREVIEW CARD */}
        <div className="mt-16 card-3d-wrap max-w-4xl mx-auto">
          <div className="card relative rounded-3xl border border-white/[0.12] bg-[#0c1428]/80 p-6 sm:p-10 shadow-3d-card backdrop-blur-2xl">
            {/* Top specular reflection */}
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left">
              {/* Left Voice Simulation Card */}
              <div className="md:col-span-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
                      <Mic className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Voice Question: Feedback & Goals</h4>
                      <p className="text-xs text-slate-400">Respondent speaks naturally...</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    Live Transcription
                  </span>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-black/50 p-4 space-y-3">
                  <p className="text-sm text-slate-200 italic leading-relaxed">
                    “We need an enterprise analytics dashboard ready by Q3 with real-time sync, and our team size is 12 engineers.”
                  </p>
                  
                  {/* Equalizer animation */}
                  <div className="flex items-end gap-1.5 h-8 pt-2">
                    {[4, 12, 24, 16, 8, 20, 28, 14, 10, 22, 18, 9, 25, 15, 6, 12].map((h, i) => (
                      <div
                        key={i}
                        className="w-full rounded-full bg-gradient-to-t from-indigo-500 to-sky-400"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-indigo-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                    Auto-categorized
                  </span>
                  <span className="flex items-center gap-1 text-indigo-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                    Confidence: 98.7%
                  </span>
                  <span className="flex items-center gap-1 text-indigo-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                    Zero typos
                  </span>
                </div>
              </div>

              {/* Right Structured JSON Extraction Preview */}
              <div className="md:col-span-5 rounded-2xl border border-white/[0.08] bg-[#070b16] p-4 font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-[11px] text-slate-500 font-sans">
                  <span>Structured AI Output</span>
                  <span className="text-indigo-400 font-mono">JSON</span>
                </div>
                <div className="space-y-1 text-slate-400">
                  <p><span className="text-purple-400">&#123;</span></p>
                  <p className="pl-3"><span className="text-sky-300">&quot;requirement&quot;</span>: <span className="text-emerald-300">&quot;Analytics Dashboard&quot;</span>,</p>
                  <p className="pl-3"><span className="text-sky-300">&quot;deadline&quot;</span>: <span className="text-emerald-300">&quot;Q3&quot;</span>,</p>
                  <p className="pl-3"><span className="text-sky-300">&quot;real_time_sync&quot;</span>: <span className="text-amber-300">true</span>,</p>
                  <p className="pl-3"><span className="text-sky-300">&quot;team_size&quot;</span>: <span className="text-indigo-300">12</span></p>
                  <p><span className="text-purple-400">&#125;</span></p>
                </div>
                <div className="pt-2">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-400 flex items-center gap-1.5 font-sans">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Valid & submitted to database
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid with 3D Cards */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card group hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Speak Naturally</h3>
            <p className="mt-2 text-sm text-slate-400">
              Users talk in sentences, pauses, and colloquial language. AI transcribes and extracts the exact answers required.
            </p>
          </div>

          <div className="card group hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">4x Faster Form Fills</h3>
            <p className="mt-2 text-sm text-slate-400">
              Speaking is 300% faster than typing on mobile. Watch response rates climb and drop-off rates vanish.
            </p>
          </div>

          <div className="card group hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Analytics</h3>
            <p className="mt-2 text-sm text-slate-400">
              Manage responses in clean tabular format, export data, and inspect confidence scores for every question.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} VoiceForm AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300">Creator Sign In</Link>
            <Link href="/login?tab=signup" className="hover:text-slate-300">Sign Up</Link>
            <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
