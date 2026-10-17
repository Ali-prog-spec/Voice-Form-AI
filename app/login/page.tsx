"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Mic,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ShieldCheck,
  Zap,
  Check,
  Radio,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialMode = searchParams.get("tab") === "signup" || searchParams.get("mode") === "signup" ? "up" : "in";
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
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  // 3D Card Interactive Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => {
    // Simulated soundwave fluctuation
    const interval = setInterval(() => {
      setVoiceActive((prev) => !prev);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTilt({ x: rotateX, y: rotateY });
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlarePos({ x: 50, y: 50, opacity: 0 });
  };

  // Password Strength Calculation
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // 0 to 4
  };

  const strengthScore = calculatePasswordStrength(password);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return setMessage({ type: "error", text: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return setMessage({ type: "error", text: "Password must be at least 6 characters long." });
    }

    if (mode === "up") {
      if (!fullName.trim()) {
        return setMessage({ type: "error", text: "Please enter your full name." });
      }
      if (password !== confirmPassword) {
        return setMessage({ type: "error", text: "Passwords do not match." });
      }
      if (!agreeTerms) {
        return setMessage({ type: "error", text: "Please agree to the Terms of Service to continue." });
      }
    }

    setBusy(true);
    const supabase = createClient();

    try {
      if (mode === "in") {
        const { data, error } = await supabase.auth.signInWithPassword({
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
          // Immediately signed in
          const next = searchParams.get("next");
          const redirectUrl = next && next.startsWith("/") ? next : "/dashboard";
          window.location.href = redirectUrl;
        } else {
          setMessage({
            type: "success",
            text: "Account created successfully! Please check your email inbox to confirm your address before logging in.",
          });
        }
      }
    } catch (err: unknown) {
      setBusy(false);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
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
          redirectTo: `${window.location.origin}/auth/callback`,
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
        text: err instanceof Error ? err.message : "Could not initialize social sign-in.",
      });
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      return setMessage({ type: "error", text: "Please enter your email address to receive a reset link." });
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
          text: "Password reset link sent! Check your email to set a new password.",
        });
        setShowForgotPassword(false);
      }
    } catch {
      setBusy(false);
      setMessage({ type: "error", text: "Failed to send reset link. Please try again." });
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10">
      {/* Container with widescreen 3D Showcase + Glass Auth Setup */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: 3D Interactive Brand & Voice Showcase */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-2">
            <Logo size={46} showTagline={true} />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Next-Gen Voice-First Form Automation
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Forms people answer by{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-sky-400 bg-clip-text text-transparent">
                speaking
              </span>
              .
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-xl">
              Turn natural human speech into clean, validated, and structured JSON responses automatically. Zero manual typing friction.
            </p>
          </div>

          {/* INTERACTIVE 3D PERSPECTIVE CARD SHOWCASE */}
          <div className="card-3d-wrap pt-2">
            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              }}
              className="card-3d relative rounded-3xl border border-white/[0.12] bg-[#0c1326]/85 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl transition-transform duration-150 ease-out overflow-hidden group cursor-pointer"
            >
              {/* Dynamic Specular Glare */}
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}), transparent 80%)`,
                }}
              />

              {/* Ambient neon backdrop glow inside 3D card */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />

              <div className="relative z-10 space-y-6">
                {/* 3D Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow-sm">
                      <Mic className="h-5 w-5 text-white" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Live Voice Processor</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                        Speech-to-Structured Form v2.4
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Check className="h-3 w-3" /> 99.4% Precision
                  </span>
                </div>

                {/* 3D Audio Frequency Waveform Bars */}
                <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                      Acoustic Input Spectrum
                    </span>
                    <span className="text-[11px] font-mono text-indigo-300">48.0 kHz • 16-bit FLAC</span>
                  </div>

                  {/* Equalizer Waveform Visualization */}
                  <div className="flex items-end justify-between h-14 px-2 gap-1.5">
                    {[
                      "h-3 group-hover:h-8",
                      "h-6 group-hover:h-12",
                      "h-10 group-hover:h-14",
                      "h-8 group-hover:h-10",
                      "h-4 group-hover:h-7",
                      "h-9 group-hover:h-12",
                      "h-12 group-hover:h-14",
                      "h-7 group-hover:h-11",
                      "h-5 group-hover:h-9",
                      "h-11 group-hover:h-13",
                      "h-8 group-hover:h-10",
                      "h-4 group-hover:h-6",
                      "h-9 group-hover:h-12",
                      "h-11 group-hover:h-14",
                      "h-6 group-hover:h-10",
                      "h-3 group-hover:h-6",
                    ].map((heightClass, idx) => (
                      <div
                        key={idx}
                        className={`w-full rounded-full bg-gradient-to-t from-indigo-600 via-purple-500 to-sky-400 transition-all duration-300 ease-in-out ${heightClass}`}
                        style={{
                          opacity: voiceActive ? 0.95 : 0.65,
                          filter: "drop-shadow(0 0 6px rgba(99,102,241,0.5))",
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/[0.05] pt-2.5">
                    <span className="italic text-slate-300">“My budget is around \$5,000 and we want to launch by next month.”</span>
                    <span className="text-indigo-400 font-semibold font-mono">Mapped → budget: 5000</span>
                  </div>
                </div>

                {/* 3D Floating Detail Cards with depth effect */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center transition-all duration-200 group-hover:border-indigo-500/30">
                    <p className="text-xl font-extrabold text-white">4.8x</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Completion Rate</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center transition-all duration-200 group-hover:border-purple-500/30">
                    <p className="text-xl font-extrabold text-white">45s</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Avg Answer Time</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center transition-all duration-200 group-hover:border-sky-500/30">
                    <p className="text-xl font-extrabold text-white">0%</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Typing Required</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof / Security Badge */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              SOC2 & GDPR Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" />
              Instant Whisper Speech AI
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-sky-400" />
              Direct Supabase Database Sync
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Glass Auth Container (Sign In / Sign Up) */}
        <div className="lg:col-span-5 w-full">
          <div className="relative rounded-3xl border border-white/[0.12] bg-[#0c1224]/90 p-6 sm:p-8 shadow-3d-card backdrop-blur-2xl">
            {/* Top ambient highlight glow */}
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />

            {/* TAB SWITCHER: Sign In vs Create Account */}
            <div className="relative flex rounded-xl bg-black/40 p-1 border border-white/[0.08] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("in");
                  setMessage(null);
                  setShowForgotPassword(false);
                }}
                className={`relative flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === "in"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-glow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("up");
                  setMessage(null);
                  setShowForgotPassword(false);
                }}
                className={`relative flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === "up"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-glow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* HEADER TEXT */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {showForgotPassword
                  ? "Reset your password"
                  : mode === "in"
                  ? "Welcome back"
                  : "Start creating voice forms"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {showForgotPassword
                  ? "Enter your account email to receive a recovery link."
                  : mode === "in"
                  ? "Sign in to manage your forms and real-time responses."
                  : "Free 14-day creator trial. No credit card required."}
              </p>
            </div>

            {/* STATUS / ERROR NOTIFICATION */}
            {message && (
              <div
                role="alert"
                className={`mb-5 flex items-start gap-3 rounded-xl p-3.5 text-sm transition-all duration-200 ${
                  message.type === "error"
                    ? "border border-red-500/30 bg-red-500/10 text-red-200"
                    : message.type === "success"
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                }`}
              >
                {message.type === "error" ? (
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                )}
                <div className="flex-1 font-medium">{message.text}</div>
              </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {showForgotPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className="input pl-10"
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-sm">
                  {busy ? "Sending recovery link..." : "Send Reset Link"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              /* MAIN SIGN IN / SIGN UP FORM */
              <form onSubmit={handleAuth} className="space-y-4">
                {/* Full Name (Sign Up only) */}
                {mode === "up" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        className="input pl-10"
                        type="text"
                        required
                        placeholder="Sarah Connor"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className="input pl-10"
                      type="email"
                      required
                      placeholder="name@work.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Password
                    </label>
                    {mode === "in" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setMessage(null);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className="input pl-10 pr-10"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter for Sign Up */}
                  {mode === "up" && password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`flex-1 rounded-full transition-colors duration-200 ${
                              strengthScore >= step
                                ? strengthScore >= 3
                                  ? "bg-emerald-400"
                                  : strengthScore === 2
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {strengthScore <= 1 && "Weak — add more characters"}
                        {strengthScore === 2 && "Fair — include numbers or mixed case"}
                        {strengthScore >= 3 && "Strong password"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password (Sign Up only) */}
                {mode === "up" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        className="input pl-10"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      {confirmPassword && confirmPassword === password && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                  </div>
                )}

                {/* Remember Me / Terms Checkboxes */}
                {mode === "in" ? (
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500/40"
                      />
                      <span>Remember this browser for 30 days</span>
                    </label>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 pt-0.5">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500/40"
                      />
                      <span>
                        I agree to VoiceForm AI&apos;s{" "}
                        <a href="#" className="text-indigo-400 underline hover:text-indigo-300">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-indigo-400 underline hover:text-indigo-300">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary w-full py-3 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-glow-md mt-2"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {mode === "in" ? "Authenticating..." : "Creating Account..."}
                    </span>
                  ) : (
                    <>
                      <span>{mode === "in" ? "Sign In to Dashboard" : "Create Free Account"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OR DIVIDER */}
            {!showForgotPassword && (
              <>
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <div className="relative bg-[#0c1224] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Or continue with
                  </div>
                </div>

                {/* SOCIAL AUTH BUTTONS */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!!oauthBusy}
                    onClick={() => handleOAuth("google")}
                    className="btn-secondary py-2.5 flex items-center justify-center gap-2 text-xs font-semibold"
                  >
                    {/* Google SVG */}
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>{oauthBusy === "google" ? "Connecting..." : "Google"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!!oauthBusy}
                    onClick={() => handleOAuth("github")}
                    className="btn-secondary py-2.5 flex items-center justify-center gap-2 text-xs font-semibold"
                  >
                    {/* GitHub SVG */}
                    <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>{oauthBusy === "github" ? "Connecting..." : "GitHub"}</span>
                  </button>
                </div>
              </>
            )}

            {/* FOOTER SWITCHER */}
            <div className="mt-6 text-center text-xs text-slate-400">
              {mode === "in" ? (
                <p>
                  Don&apos;t have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("up");
                      setMessage(null);
                      setShowForgotPassword(false);
                    }}
                    className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Create one for free
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
                    className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Sign in here
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
        <div className="min-h-screen flex items-center justify-center bg-[#05070e] text-slate-300">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm">Loading VoiceForm AI...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
