export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

interface Segment {
  text: string;
  no_speech_prob?: number;
  avg_logprob?: number;
}

/** Whisper tends to hallucinate stock phrases on silence/noise; treat those as empty. */
const HALLUCINATIONS = /^(thank you\.?|thanks( for watching)?\.?|you\.?|bye\.?|\.+)$/i;

/** Provider-specific: Groq Whisper speech-to-text. Audio is streamed through, never stored. */
export async function transcribeAudio(file: File): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  const body = new FormData();
  body.append("file", file, file.name || "audio.webm");
  body.append("model", process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3");
  body.append("response_format", "verbose_json");
  body.append("temperature", "0");
  const language = process.env.TRANSCRIBE_LANGUAGE ?? "en";
  if (language) body.append("language", language);
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Transcription failed (${res.status})`);
  const json = await res.json();

  // Drop segments Whisper itself thinks are not speech.
  const segments: Segment[] = Array.isArray(json.segments) ? json.segments : [];
  const full = typeof json.text === "string" ? json.text.trim() : "";
  const kept = segments
    .filter((s) => (s.no_speech_prob ?? 0) < 0.85)
    .map((s) => s.text)
    .join(" ")
    .trim();
  const text = kept || full;
  if (process.env.NODE_ENV !== "production") {
    // Diagnostics only (no transcript content): helps tune silence filtering.
    console.log(
      `transcribe: ${file.size}B ${file.type}, segments=${segments.length}, no_speech=${segments
        .map((s) => s.no_speech_prob?.toFixed(2))
        .join(",")}, chars=${full.length}`,
    );
  }
  return HALLUCINATIONS.test(text) ? "" : text;
}
