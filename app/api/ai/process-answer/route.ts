import { NextResponse } from "next/server";
import { fail, parseBody } from "@/lib/api";
import { extractAnswer } from "@/lib/ai/extract-answer";
import { createAdminClient } from "@/lib/supabase/server";
import { processAnswerSchema } from "@/lib/validation/schemas";
import type { Question } from "@/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await parseBody(req, processAnswerSchema);
  if ("error" in body) return body.error;
  const { session_id, question_id, transcript } = body.data;
  const db = createAdminClient();

  const { data: session } = await db
    .from("sessions")
    .select("form_id,status")
    .eq("id", session_id)
    .maybeSingle();
  if (!session || session.status !== "in_progress") return fail("Session is not active", 404);
  // The question definition comes from the DB, never from the client.
  const { data: question } = await db
    .from("questions")
    .select("id,question_text,question_type,options,is_required")
    .eq("id", question_id)
    .eq("form_id", session.form_id)
    .maybeSingle();
  if (!question) return fail("Question not found", 404);

  try {
    return NextResponse.json(await extractAnswer(question as Question, transcript));
  } catch (e) {
    console.error("process-answer failed:", e instanceof Error ? e.message : "unknown");
    return fail("The AI service is unavailable. Please try again.", 502);
  }
}
