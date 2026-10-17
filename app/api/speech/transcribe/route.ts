import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { transcribeAudio, MAX_AUDIO_BYTES } from "@/lib/speech/transcribe";
import { createAdminClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_AUDIO_BYTES + 100_000) return fail("Audio too large", 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid upload");
  }
  const audio = form.get("audio");
  const sessionId = form.get("session_id");
  if (!(audio instanceof File) || !uuid.safeParse(sessionId).success) return fail("Invalid upload");
  if (audio.size === 0) return fail("Recording was empty");
  if (audio.size > MAX_AUDIO_BYTES) return fail("Audio too large", 413);
  if (!/^(audio|video)\//.test(audio.type)) return fail("Unsupported audio type", 415);

  // Only active respondent sessions may use transcription.
  const { data: session } = await createAdminClient()
    .from("sessions")
    .select("id")
    .eq("id", sessionId as string)
    .eq("status", "in_progress")
    .maybeSingle();
  if (!session) return fail("Session is not active", 404);

  try {
    const transcript = await transcribeAudio(audio);
    if (!transcript) return fail("We could not hear anything. Please try again.", 422);
    return NextResponse.json({ transcript });
  } catch (e) {
    console.error("transcribe failed:", e instanceof Error ? e.message : "unknown");
    return fail("Speech recognition failed. Please try again.", 502);
  }
}
