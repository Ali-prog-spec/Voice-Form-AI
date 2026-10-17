export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

/** Provider-specific: Groq Whisper speech-to-text. Audio is streamed through, never stored. */
export async function transcribeAudio(file: File): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  const body = new FormData();
  body.append("file", file, file.name || "audio.webm");
  body.append("model", process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3-turbo");
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Transcription failed (${res.status})`);
  const json = await res.json();
  return typeof json.text === "string" ? json.text.trim() : "";
}
