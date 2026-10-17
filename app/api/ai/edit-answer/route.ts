import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, parseBody } from "@/lib/api";
import { editAnswer } from "@/lib/ai/edit-answer";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeAnswer } from "@/lib/validation/answers";
import { uuid } from "@/lib/validation/schemas";
import type { Question } from "@/types";

export const maxDuration = 30;

const schema = z.object({
  session_id: uuid,
  question_id: uuid,
  current_answer: z.union([z.string().max(5000), z.number()]),
  transcript: z.string().trim().min(1).max(2000),
});

/** Applies a spoken correction ("it's isb not isp") to an already-filled answer. */
export async function POST(req: Request) {
  const body = await parseBody(req, schema);
  if ("error" in body) return body.error;
  const { session_id, question_id, current_answer, transcript } = body.data;
  const db = createAdminClient();

  const { data: session } = await db.from("sessions").select("form_id,status").eq("id", session_id).maybeSingle();
  if (!session || session.status !== "in_progress") return fail("Session is not active", 404);
  const { data: question } = await db
    .from("questions")
    .select("id,question_text,question_type,options,is_required")
    .eq("id", question_id)
    .eq("form_id", session.form_id)
    .maybeSingle();
  if (!question) return fail("Question not found", 404);

  const current = normalizeAnswer(question as Question, current_answer);
  if (current === null) return fail("The current answer is not valid for this question");
  try {
    return NextResponse.json(await editAnswer(question as Question, current, transcript));
  } catch (e) {
    console.error("edit-answer failed:", e instanceof Error ? e.message : "unknown");
    return fail("The AI service is unavailable. Please try again.", 502);
  }
}
