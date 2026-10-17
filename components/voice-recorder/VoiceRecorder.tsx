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

  const [level, setLevel] = useState(0);
  const peak = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);
  const meter = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (meter.current) clearInterval(meter.current);
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
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
          const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
          // The level meter is advisory only; it never blocks sending the recording.
          fail(peak.current < 0.02 ? `${msg} (The microphone level looked flat — check the selected microphone.)` : msg);
        }
      };
      peak.current = 0;
      setLevel(0);
      try {
        const ctx = new AudioContext();
        audioCtx.current = ctx;
        await ctx.resume();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        meter.current = setInterval(() => {
          analyser.getByteTimeDomainData(data);
          let max = 0;
          for (const v of data) max = Math.max(max, Math.abs(v - 128) / 128);
          peak.current = Math.max(peak.current, max);
          setLevel(max);
        }, 80);
      } catch {
        peak.current = 1; // meter unavailable: don't block recording
      }
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
        className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-subtle transition-all duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 active:scale-95
          ${
            recording
              ? "bg-red-600 hover:bg-red-500 border border-red-400/40 animate-pulse"
              : "bg-zinc-800 hover:bg-zinc-700 border border-white/[0.1]"
          }`}
      >
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
        ) : recording ? (
          <Square className="h-6 w-6 fill-white text-white" />
        ) : state === "success" ? (
          <Check className="h-7 w-7 text-emerald-400" />
        ) : (
          <Mic className="h-7 w-7 text-zinc-200" />
        )}
      </button>

      {recording && (
        <div className="h-1 w-36 overflow-hidden rounded-full bg-zinc-800" aria-label="Microphone level">
          <div className="h-full rounded-full bg-blue-500 transition-[width] duration-75" style={{ width: `${Math.min(100, level * 300)}%` }} />
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-zinc-400 font-medium">
          {state === "idle" && "Click the microphone to answer by voice"}
          {recording && (
            <span className="text-red-400 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              Recording • {seconds}s (click to stop)
            </span>
          )}
          {busy && <span className="text-zinc-400">Processing answer with AI...</span>}
          {state === "success" && <span className="text-emerald-400">Answer captured ✓</span>}
          {state === "error" && <span className="text-zinc-400">Tap to try again</span>}
        </p>
        {error && (
          <p role="alert" className="mt-2 max-w-sm text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
