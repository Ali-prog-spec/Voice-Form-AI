"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CopyLinkButton } from "@/components/ui/DashboardActions";

interface Result {
  id: string;
  slug: string;
  title: string;
  count: number;
  warnings: string[];
}

export default function ImportForm({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const started = useRef(false);

  async function run(link: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/forms/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: link }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError(json?.error ?? "Network problem. Please try again.");
    setResult(json as Result);
  }

  useEffect(() => {
    // Arrived from the landing page with a link: import right away (once).
    if (initialUrl && !started.current) {
      started.current = true;
      run(initialUrl);
    }
  }, [initialUrl]);

  if (result) {
    return (
      <div className="card mt-8 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Imported</p>
        <h2 className="text-xl font-bold text-white">{result.title}</h2>
        <p className="text-sm text-slate-400">{result.count} questions are ready to be answered by voice.</p>
        {result.warnings.length > 0 && (
          <ul className="space-y-1 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
            {result.warnings.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href={`/f/${result.slug}`} target="_blank" className="btn-primary">Try it by voice</Link>
          <CopyLinkButton slug={result.slug} />
          <Link href={`/forms/${result.id}/responses`} className="btn-secondary">Responses</Link>
          <Link href="/dashboard" className="btn-secondary">Dashboard</Link>
        </div>
        <p className="text-xs text-slate-500">Share the link above with respondents — that&apos;s the voice version of your form.</p>
      </div>
    );
  }

  return (
    <form
      className="card mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) run(url);
      }}
    >
      <label className="block text-sm font-medium text-slate-200">
        Google Form link
        <input
          className="input mt-1"
          type="url"
          required
          placeholder="https://docs.google.com/forms/d/e/…/viewform  or  https://forms.gle/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Reading your form…" : "Import form"}</button>
      <p className="text-xs text-slate-500">
        In Google Forms click <strong>Send</strong> → link icon → copy. The form must allow responses without signing in.
      </p>
    </form>
  );
}
