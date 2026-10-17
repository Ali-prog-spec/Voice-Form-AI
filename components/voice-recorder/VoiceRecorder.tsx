"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    <div className="flex flex-col items-center gap-3" aria-live="polite">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled || busy}
        aria-label={recording ? "Stop recording" : "Start recording"}
        className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl text-white shadow-lg transition
          focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:opacity-60
          ${recording ? "animate-pulse bg-red-500 hover:bg-red-600" : "bg-brand-600 hover:bg-brand-700"}`}
      >
        {busy ? <span className="h-8 w-8 animate-spin rounded-full border-4 border-white/40 border-t-white" /> : recording ? "■" : "🎙"}
      </button>
      <p className="text-sm text-slate-600">
        {state === "idle" && "Tap to speak"}
        {recording && `Listening… ${seconds}s — tap to stop`}
        {busy && "Processing…"}
        {state === "success" && "Got it ✓"}
        {state === "error" && "Tap the mic to try again"}
      </p>
      {error && (
        <p role="alert" className="max-w-sm text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
