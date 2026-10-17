"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(mode: "in" | "up") {
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (!data.session) return setMessage("Check your email to confirm your account, then sign in.");
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next && next.startsWith("/") ? next : "/dashboard";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6"><Logo /></div>
      <h1 className="text-2xl font-bold">Creator sign in</h1>
      <form
        className="card mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit("in");
        }}
      >
        <label className="block text-sm font-medium">
          Email
          <input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input className="input mt-1" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {message && <p role="alert" className="text-sm text-red-600">{message}</p>}
        <button className="btn-primary w-full" disabled={busy}>Sign in</button>
        <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => submit("up")}>
          Create account
        </button>
      </form>
    </main>
  );
}
