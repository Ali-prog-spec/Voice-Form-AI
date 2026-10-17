"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Check } from "lucide-react";

export type RecorderState = "idle" | "recording" | "processing" | "success" | "error";

interface Props {
  /** Called with the finished recording. Throw an Error (with a user-facing message) to show the error state. */
  onAudio: (blob: Blob) => Promise<void>;
  disabled?: boolean;
  maxSeconds?: number;
}

function pickMimeType() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((t) => MediaRecorder.isTypeSupported(t));
}

function micError(e: unknown) {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Microphone access was denied. Allow it in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No microphone was found. Connect one, or type your answer instead.";
  return "Could not start recording. Please try again.";
}

export default function VoiceRecorder({ onAudio, disabled, maxSeconds = 90 }: Props) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      cleanup();
    };
  }, [cleanup]);

  const fail = (msg: string) => {
    if (!alive.current) return;
    setError(msg);
    setState("error");
  };

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  async function start() {
    setError(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return fail("Voice recording isn't supported in this browser. You can type your answer instead.");
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(s, mimeType ? { mimeType } : undefined);
      recorder.current = rec;
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      rec.onerror = () => {
        cleanup();
        fail("Recording failed. Please try again.");
      };
      rec.onstop = async () => {
        cleanup();
        const blob = new Blob(chunks.current, { type: rec.mimeType || mimeType || "audio/webm" });
        if (!alive.current) return;
        if (blob.size < 1000) return fail("That recording was too short. Tap the mic and try again.");
        setState("processing");
        try {
          await onAudio(blob);
          if (alive.current) setState("success");
        } catch (e) {
          fail(e instanceof Error ? e.message : "Something went wrong. Please try again.");
        }
      };
      rec.start();
      setSeconds(0);
      setState("recording");
      timer.current = setInterval(() => {
        setSeconds((n) => {
          if (n + 1 >= maxSeconds) stop();
          return n + 1;
        });
      }, 1000);
    } catch (e) {
      cleanup();
      fail(micError(e));
    }
  }

  const recording = state === "recording";
  const busy = state === "processing";

  return (
    <div className="flex flex-col items-center gap-4" aria-live="polite">
      <div className="relative">
        {recording && (
          <div className="absolute -inset-3 rounded-full bg-red-500/20 blur-md animate-ping" />
        )}
        {!recording && !busy && (
          <div className="absolute -inset-2 rounded-full bg-indigo-500/30 blur-lg opacity-70 group-hover:opacity-100" />
        )}
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={disabled || busy}
          aria-label={recording ? "Stop recording" : "Start recording"}
          className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300
            focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/50 disabled:opacity-50 active:scale-95
            ${
              recording
                ? "bg-gradient-to-tr from-red-600 to-rose-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-pulse border-2 border-red-300/40"
                : "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-glow-md hover:shadow-glow-lg border border-indigo-400/40 hover:scale-105"
            }`}
        >
          {busy ? (
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          ) : recording ? (
            <Square className="h-8 w-8 fill-white text-white" />
          ) : state === "success" ? (
            <Check className="h-10 w-10 text-white" />
          ) : (
            <Mic className="h-10 w-10 text-white" />
          )}
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-slate-300">
          {state === "idle" && "Tap the microphone to speak"}
          {recording && (
            <span className="text-red-400 font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              Recording… {seconds}s (tap to stop)
            </span>
          )}
          {busy && <span className="text-indigo-300 animate-pulse">Transcribing & structuring with AI…</span>}
          {state === "success" && <span className="text-emerald-400 font-semibold">Answer recorded ✓</span>}
          {state === "error" && <span className="text-amber-400 font-medium">Tap microphone to try again</span>}
        </p>
        {error && (
          <p role="alert" className="mt-2 max-w-sm text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
