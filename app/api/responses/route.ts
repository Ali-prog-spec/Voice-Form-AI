import { NextResponse } from "next/server";
import { fail, parseBody } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeAnswer } from "@/lib/validation/answers";
import { saveResponseSchema } from "@/lib/validation/schemas";
import type { Question } from "@/types";

export async function POST(req: Request) {
  const body = await parseBody(req, saveResponseSchema);
  if ("error" in body) return body.error;
  const d = body.data;
  const db = createAdminClient();

  const { data: session } = await db
    .from("sessions")
    .select("form_id,status")
    .eq("id", d.session_id)
    .maybeSingle();
  if (!session || session.status !== "in_progress") return fail("Session is not active", 404);
  const { data: question } = await db
    .from("questions")
    .select("id,question_type,options")
    .eq("id", d.question_id)
    .eq("form_id", session.form_id)
    .maybeSingle();
  if (!question) return fail("Question not found", 404);

  const answer = d.answer === null ? null : normalizeAnswer(question as Question, d.answer);
  if (d.answer !== null && answer === null) return fail("Answer is not valid for this question");

  const { error } = await db.from("responses").upsert(
    {
      session_id: d.session_id,
      question_id: d.question_id,
      raw_transcript: d.raw_transcript ?? null,
      ai_answer: answer,
      confidence: d.confidence ?? null,
      was_edited: d.was_edited,
    },
    { onConflict: "session_id,question_id" },
  );
  if (error) return fail("Could not save answer", 500);
  return NextResponse.json({ ok: true });
}
