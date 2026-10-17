"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Mic,
  Check,
  Volume2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode =
    searchParams.get("tab") === "signup" || searchParams.get("mode") === "signup"
      ? "up"
      : "in";
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return setMessage({
        type: "error",
        text: "Please enter a valid email address.",
      });
    }

    if (password.length < 6) {
      return setMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
    }

    if (mode === "up") {
      if (!fullName.trim()) {
        return setMessage({
          type: "error",
          text: "Please enter your full name.",
        });
      }
      if (password !== confirmPassword) {
        return setMessage({
          type: "error",
          text: "Passwords do not match.",
        });
      }
      if (!agreeTerms) {
        return setMessage({
          type: "error",
          text: "You must accept the terms of service to continue.",
        });
      }
    }

    setBusy(true);
    const supabase = createClient();

    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setBusy(false);
          return setMessage({ type: "error", text: error.message });
        }

        const next = searchParams.get("next");
        const redirectUrl = next && next.startsWith("/") ? next : "/dashboard";
        window.location.href = redirectUrl;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        setBusy(false);
        if (error) {
          return setMessage({ type: "error", text: error.message });
        }

        if (data.session) {
          const next = searchParams.get("next");
          const redirectUrl = next && next.startsWith("/") ? next : "/dashboard";
          window.location.href = redirectUrl;
        } else {
          setMessage({
            type: "success",
            text: "Account created! Please check your email inbox to verify your address.",
          });
        }
      }
    } catch (err: unknown) {
      setBusy(false);
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      });
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setMessage(null);
    setOauthBusy(provider);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        setOauthBusy(null);
        setMessage({ type: "error", text: error.message });
      }
    } catch (err: unknown) {
      setOauthBusy(null);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not sign in with provider.",
      });
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      return setMessage({
        type: "error",
        text: "Please enter your email to receive a reset link.",
      });
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?tab=reset`,
      });
      setBusy(false);
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Reset link sent! Please check your inbox.",
        });
        setShowForgotPassword(false);
      }
    } catch {
      setBusy(false);
      setMessage({ type: "error", text: "Failed to send reset link." });
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* LEFT COLUMN: Clean Minimal Product Preview */}
        <div className="lg:col-span-6 hidden lg:flex flex-col justify-center space-y-6 pr-4">
          <Logo size={36} showTagline={true} />

          <div className="space-y-3 pt-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#ededed] leading-tight">
              Forms respondents answer by speaking.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              VoiceForm collects audio responses and extracts clean, validated answers directly into your database.
            </p>
          </div>

          {/* Minimalist Live Demo Card */}
          <div className="rounded-xl border border-white/[0.08] bg-[#121316] p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-medium text-zinc-300">Live Voice Flow</span>
              </div>
              <span className="font-mono text-zinc-500">Whisper AI</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-zinc-900/80 p-3.5 border border-white/[0.05]">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <Mic className="h-3.5 w-3.5 text-blue-400" />
                  <span>Transcript</span>
                </div>
                <p className="text-xs text-zinc-300 italic leading-relaxed">
                  &ldquo;I want to schedule our kickoff meeting for next Tuesday at 2 PM, and invite 4 team members.&rdquo;
                </p>
              </div>

              {/* Clean Structured Output */}
              <div className="rounded-lg bg-zinc-950/70 p-3.5 border border-white/[0.05] font-mono text-[11px] text-zinc-400 space-y-1">
                <div className="text-zinc-500 font-sans text-[11px] mb-1 font-medium">Extracted Data</div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">meeting_type:</span>
                  <span className="text-zinc-200">&quot;Kickoff&quot;</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">scheduled_for:</span>
                  <span className="text-zinc-200">&quot;Tuesday 14:00&quot;</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">attendees:</span>
                  <span className="text-blue-400">4</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Check className="h-3.5 w-3.5 text-blue-500" />
                No typing required
              </span>
              <span>Validated & saved</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Minimalist Auth Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          {/* Mobile Logo display */}
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo size={34} showTagline={true} />
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#121316] p-6 sm:p-8 shadow-card">
            
            {/* Mode Toggle Tabs */}
            <div className="flex rounded-lg bg-zinc-900 p-1 border border-white/[0.06] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("in");
                  setMessage(null);
                  setShowForgotPassword(false);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === "in"
                    ? "bg-[#18191d] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("up");
                  setMessage(null);
                  setShowForgotPassword(false);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === "up"
                    ? "bg-[#18191d] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#ededed] tracking-tight">
                {showForgotPassword
                  ? "Reset password"
                  : mode === "in"
                  ? "Welcome back"
                  : "Create your account"}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                {showForgotPassword
                  ? "Enter your email to receive recovery instructions."
                  : mode === "in"
                  ? "Sign in to manage your forms and view responses."
                  : "Start creating conversational voice forms in seconds."}
              </p>
            </div>

            {/* Notifications */}
            {message && (
              <div
                role="alert"
                className={`mb-4 flex items-start gap-2.5 rounded-lg p-3 text-xs leading-relaxed ${
                  message.type === "error"
                    ? "border border-red-500/20 bg-red-500/10 text-red-300"
                    : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {message.type === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Forgot Password Flow */}
            {showForgotPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      className="input pl-9"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary w-full py-2.5 text-xs font-medium"
                >
                  {busy ? "Sending link..." : "Send reset link"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="btn-secondary w-full py-2 text-xs"
                >
                  Back to sign in
                </button>
              </form>
            ) : (
              /* Main Form */
              <form onSubmit={handleAuth} className="space-y-4">
                {mode === "up" && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        className="input pl-9"
                        type="text"
                        required
                        placeholder="Alex Morgan"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      className="input pl-9"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Password
                    </label>
                    {mode === "in" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setMessage(null);
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      className="input pl-9 pr-9"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Clean Password Strength */}
                  {mode === "up" && password.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="flex gap-1 flex-1 h-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`flex-1 rounded-full h-full transition-colors ${
                              strength >= step
                                ? strength >= 3
                                  ? "bg-blue-500"
                                  : strength === 2
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                                : "bg-zinc-800"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {strength <= 1 ? "Weak" : strength === 2 ? "Medium" : "Strong"}
                      </span>
                    </div>
                  )}
                </div>

                {mode === "up" && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        className="input pl-9 pr-9"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      {confirmPassword && confirmPassword === password && (
                        <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                      )}
                    </div>
                  </div>
                )}

                {mode === "in" ? (
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-white/10 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Remember this device</span>
                    </label>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400 pt-0.5">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-white/10 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        I accept the{" "}
                        <a href="#" className="text-zinc-200 underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-zinc-200 underline">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 mt-2"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>{mode === "in" ? "Signing in..." : "Creating account..."}</span>
                    </span>
                  ) : (
                    <>
                      <span>{mode === "in" ? "Sign in" : "Create account"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Social Divider */}
            {!showForgotPassword && (
              <>
                <div className="relative my-5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative bg-[#121316] px-2 text-[11px] uppercase tracking-wider text-zinc-500">
                    Or continue with
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!!oauthBusy}
                    onClick={() => handleOAuth("google")}
                    className="btn-secondary py-2 flex items-center justify-center gap-2 text-xs"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    disabled={!!oauthBusy}
                    onClick={() => handleOAuth("github")}
                    className="btn-secondary py-2 flex items-center justify-center gap-2 text-xs"
                  >
                    <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>
              </>
            )}

            {/* Footer switcher */}
            <div className="mt-6 text-center text-xs text-zinc-400">
              {mode === "in" ? (
                <p>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("up");
                      setMessage(null);
                      setShowForgotPassword(false);
                    }}
                    className="font-medium text-blue-400 hover:text-blue-300"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("in");
                      setMessage(null);
                      setShowForgotPassword(false);
                    }}
                    className="font-medium text-blue-400 hover:text-blue-300"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#090a0c] text-zinc-400 text-sm">
          Loading VoiceForm...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
