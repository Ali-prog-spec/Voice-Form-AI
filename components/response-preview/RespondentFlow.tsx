"use client";

import { useCallback, useEffect, useState } from "react";
import QuestionInput from "@/components/question-renderer/QuestionInput";
import VoiceRecorder from "@/components/voice-recorder/VoiceRecorder";
import { useSpeech } from "@/components/voice-recorder/useSpeech";
import { formatAnswer, normalizeAnswer } from "@/lib/validation/answers";
import type { AiResult, AnswerValue, PublicForm, Question } from "@/types";

/** What the voice assistant reads aloud for a question. */
function questionSpeech(q: Question) {
  let text = q.question_text.replace(/[?]*$/, "?");
  if (q.question_type === "multiple_choice" && q.options?.length) {
    text += ` The options are: ${q.options.slice(0, -1).join(", ")}${q.options.length > 1 ? ", or " : ""}${q.options[q.options.length - 1]}.`;
  } else if (q.question_type === "rating") text += " Answer with a number from 1 to 5.";
  else if (q.question_type === "yes_no") text += " Answer yes or no.";
  return text;
}

interface Draft {
  value: AnswerValue | null;
  transcript: string | null;
  confidence: number | null;
  needsConfirmation: boolean;
  edited: boolean;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("Network problem. Check your connection and try again.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "Something went wrong. Please try again.");
  return json as T;
}

export default function RespondentFlow({ form }: { form: PublicForm }) {
  const qs = form.questions;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [saved, setSaved] = useState<Record<string, Draft>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"questions" | "summary" | "done">("questions");
  const [started, setStarted] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explaining, setExplaining] = useState(false);
  const [google, setGoogle] = useState<{ status?: string; prefill?: string } | null>(null);
  const speech = useSpeech();

  const startSession = useCallback(async () => {
    setStartError(null);
    try {
      const s = await postJson<{ id: string }>("/api/sessions", { form_id: form.id });
      setSessionId(s.id);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Could not start.");
    }
  }, [form.id]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  // Voice assistant: read each question aloud when it appears and the user still has to answer it.
  const capturing = draft === null;
  const { speak, cancel } = speech;
  useEffect(() => {
    if (!started || !autoRead || stage !== "questions" || !capturing) return;
    const current = qs[Math.min(idx, qs.length - 1)];
    if (current) speak(questionSpeech(current));
  }, [started, autoRead, stage, capturing, idx, qs, speak]);

  useEffect(() => {
    if (stage !== "questions") cancel();
  }, [stage, cancel]);

  if (qs.length === 0) return <p className="text-center text-slate-600">This form has no questions.</p>;
  if (startError)
    return (
      <div className="card text-center">
        <p role="alert" className="text-red-600">{startError}</p>
        <button className="btn-primary mt-4" onClick={startSession}>Retry</button>
      </div>
    );
  if (!sessionId) return <p className="text-center text-slate-500">Loading…</p>;

  // A tap is required before browsers allow speech, so the assistant starts from this welcome step.
  if (!started && speech.supported) {
    return (
      <div className="card py-10 text-center">
        <p className="text-sm text-slate-400">{qs.length} questions · answer by speaking</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          A voice assistant will read each question to you and can explain it if it&apos;s unclear.
        </p>
        <button
          className="btn-primary mt-6 px-6 py-3"
          onClick={() => {
            setStarted(true);
            speech.speak(`Hi! I'll read each question aloud. Tap the microphone to answer, or ask me to explain.`);
          }}
        >
          🔊 Start with voice assistant
        </button>
        <p className="mt-4">
          <button className="text-sm text-slate-500 underline" onClick={() => { setAutoRead(false); setStarted(true); }}>
            Continue without audio
          </button>
        </p>
      </div>
    );
  }

  const q = qs[Math.min(idx, qs.length - 1)];
  const isLast = idx === qs.length - 1;

  function goTo(i: number) {
    setIdx(i);
    setDraft(saved[qs[i].id] ?? null);
    setEditing(false);
    setError(null);
    setStage("questions");
  }

  async function handleAudio(blob: Blob) {
    const fd = new FormData();
    fd.append("audio", blob, blob.type.includes("mp4") ? "audio.mp4" : "audio.webm");
    fd.append("session_id", sessionId!);
    let transcript: string;
    try {
      const res = await fetch("/api/speech/transcribe", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Speech recognition failed. Please try again.");
      transcript = json.transcript;
    } catch (e) {
      if (e instanceof TypeError) throw new Error("Network problem. Check your connection and try again.");
      throw e;
    }
    const ai = await postJson<AiResult>("/api/ai/process-answer", {
      session_id: sessionId,
      question_id: q.id,
      transcript,
    });
    setDraft({
      value: ai.answer,
      transcript,
      confidence: ai.confidence,
      needsConfirmation: ai.needs_confirmation || ai.answer === null,
      edited: false,
    });
    setEditing(false);
    setError(null);
  }

  async function saveAndContinue(d: Draft | null) {
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/responses", {
        session_id: sessionId,
        question_id: q.id,
        raw_transcript: d?.transcript ?? null,
        answer: d?.value ?? null,
        confidence: d?.confidence ?? null,
        was_edited: d?.edited ?? false,
      });
      if (d?.value != null) setSaved((s) => ({ ...s, [q.id]: { ...d, needsConfirmation: false } }));
      if (isLast) setStage("summary");
      else goTo(idx + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answer.");
    } finally {
      setBusy(false);
    }
  }

  async function explain() {
    if (explaining) return;
    const cached = explanations[q.id];
    if (cached) return speech.speak(cached);
    setExplaining(true);
    try {
      const r = await postJson<{ explanation: string }>("/api/ai/explain-question", {
        session_id: sessionId,
        question_id: q.id,
      });
      setExplanations((e) => ({ ...e, [q.id]: r.explanation }));
      speech.speak(r.explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant is unavailable right now.");
    } finally {
      setExplaining(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await postJson<{ google?: string; prefill_url?: string }>(`/api/sessions/${sessionId}/submit`, {});
      setGoogle(r.google ? { status: r.google, prefill: r.prefill_url } : null);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  }

  const progress = (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-2">
        <span>{stage === "questions" ? `Question ${idx + 1} of ${qs.length}` : "Review answers"}</span>
        <span className="font-mono text-zinc-400">
          {Math.round(((stage === "questions" ? idx : qs.length) / qs.length) * 100)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={qs.length} aria-valuenow={stage === "questions" ? idx : qs.length}>
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-200"
          style={{ width: `${((stage === "questions" ? idx : qs.length) / qs.length) * 100}%` }}
        />
      </div>
    </div>
  );

  if (stage === "done")
    return (
      <div className="card py-16 text-center border-emerald-500/30">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-3xl mb-4 shadow-glow-sm">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-white">Thank you!</h2>
        <p className="mt-2 text-slate-400">
          {google?.status === "submitted"
            ? "Your answers were filled into the Google Form and submitted."
            : "Your response has been transcribed, structured, and saved successfully."}
        </p>
        {google?.status === "failed" && google.prefill && (
          <div className="mx-auto mt-5 max-w-sm rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            <p>We saved your answers but couldn&apos;t send them to the Google Form automatically.</p>
            <a href={google.prefill} target="_blank" rel="noreferrer" className="btn-primary mt-3 w-full">
              Open pre-filled Google Form
            </a>
            <p className="mt-2 text-xs">Review it and press Submit there.</p>
          </div>
        )}
      </div>
    );

  if (stage === "summary") {
    const missing = qs.filter((x) => x.is_required && saved[x.id]?.value == null);
    return (
      <div>
        {progress}
        <h2 className="text-xl font-semibold">Review your answers</h2>
        <ul className="mt-4 space-y-3">
          {qs.map((x, i) => (
            <li key={x.id} className="card flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{x.question_text}</p>
                <p className="mt-1 font-medium">
                  {saved[x.id]?.value != null ? formatAnswer(x, saved[x.id].value!) : <span className="text-slate-400">Skipped</span>}
                </p>
              </div>
              <button className="btn-secondary shrink-0" onClick={() => goTo(i)}>Edit</button>
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        {missing.length > 0 && (
          <p className="mt-4 text-sm text-amber-700">Please answer all required questions before submitting.</p>
        )}
        <button className="btn-primary mt-6 w-full" disabled={busy || missing.length > 0} onClick={submit}>
          {busy ? "Submitting…" : "Submit"}
        </button>
      </div>
    );
  }

  const reviewing = draft !== null;
  const hasValue = draft?.value != null;
  const unsure = draft?.needsConfirmation ?? false;

  return (
    <div>
      {progress}
      <h2 className="text-2xl font-semibold leading-snug">
        {q.question_text}
        {!q.is_required && <span className="ml-2 text-sm font-normal text-slate-400">(optional)</span>}
      </h2>

      <div className="mt-8">
        {!reviewing && (
          <div className="space-y-6">
            <VoiceRecorder onAudio={handleAudio} disabled={busy} onStart={cancel} />
            {speech.supported && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button className="btn-secondary text-xs" onClick={() => speech.speak(questionSpeech(q))}>
                  🔊 {speech.speaking ? "Speaking…" : "Listen again"}
                </button>
                <button className="btn-secondary text-xs" disabled={explaining} onClick={explain}>
                  💡 {explaining ? "Thinking…" : "Explain this question"}
                </button>
                <button
                  className="btn-secondary text-xs"
                  aria-pressed={autoRead}
                  onClick={() => {
                    if (autoRead) speech.cancel();
                    setAutoRead(!autoRead);
                  }}
                >
                  Auto-read: {autoRead ? "on" : "off"}
                </button>
              </div>
            )}
            {explanations[q.id] && (
              <p className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-200">
                💡 {explanations[q.id]}
              </p>
            )}
            <p className="text-center">
              <button
                className="text-sm text-slate-500 underline"
                onClick={() => {
                  setDraft({ value: null, transcript: null, confidence: null, needsConfirmation: false, edited: true });
                  setEditing(true);
                }}
              >
                Type instead
              </button>
            </p>
          </div>
        )}

        {reviewing && !editing && (
          <div className="card">
            {draft.transcript && (
              <p className="mb-3 text-sm italic text-slate-400">You said: “{draft.transcript}”</p>
            )}
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400">AI parsed</p>
            <p className="mt-1 text-xl font-bold text-white">
              {hasValue ? formatAnswer(q, draft.value!) : "I couldn’t work out an answer."}
            </p>
            {unsure && hasValue && (
              <p className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 text-sm text-amber-300">
                I’m not completely sure — please confirm this is right, or edit it.
              </p>
            )}
          </div>
        )}

        {reviewing && editing && (
          <div className="card space-y-4">
            <QuestionInput question={q} value={draft.value} onChange={(v) => setDraft({ ...draft, value: v, edited: true })} />
            <div className="flex gap-2">
              <button
                className="btn-primary"
                disabled={normalizeAnswer(q, draft.value) === null}
                onClick={() => {
                  setDraft({ ...draft, value: normalizeAnswer(q, draft.value), needsConfirmation: false });
                  setEditing(false);
                }}
              >
                Done
              </button>
              <button className="btn-secondary" onClick={() => { setDraft(saved[q.id] ?? null); setEditing(false); }}>Cancel</button>
            </div>
          </div>
        )}

        {error && <p role="alert" className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}

        {reviewing && !editing && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn-secondary" onClick={() => { setDraft(null); setError(null); }}>Retry</button>
            {hasValue && (
              <button className="btn-primary ml-auto shadow-glow-sm" disabled={busy} onClick={() => saveAndContinue(draft)}>
                {busy ? "Saving…" : unsure ? "Confirm & continue →" : isLast ? "Continue →" : "Continue →"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-white/[0.08] pt-4">
        <button className="btn-secondary" disabled={idx === 0 || busy} onClick={() => goTo(idx - 1)}>← Back</button>
        {!q.is_required && !reviewing && (
          <button className="btn-secondary" disabled={busy} onClick={() => saveAndContinue(null)}>Skip →</button>
        )}
        {saved[q.id] && !reviewing && (
          <button className="btn-secondary" onClick={() => (isLast ? setStage("summary") : goTo(idx + 1))}>Next →</button>
        )}
      </div>
    </div>
  );
}
