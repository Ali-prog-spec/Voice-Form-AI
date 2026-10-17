"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut className="h-3.5 w-3.5 text-slate-400" />
      <span>{busy ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}

export function DemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        className="btn-secondary text-xs sm:text-sm flex items-center gap-1.5 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch("/api/forms/demo", { method: "POST" }).catch(() => null);
          setBusy(false);
          if (!res?.ok) return setError("Could not create the demo form.");
          router.refresh();
        }}
      >
        {busy ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Creating…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Add demo form</span>
          </>
        )}
      </button>
      {error && <span role="alert" className="text-xs text-red-400">{error}</span>}
    </>
  );
}

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="btn-secondary text-xs flex items-center gap-1.5"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-slate-400" />
          <span>Copy link</span>
        </>
      )}
    </button>
  );
}
