import { NextResponse } from "next/server";
import { fail, parseBody } from "@/lib/api";
import { explainQuestion } from "@/lib/ai/explain-question";
import { createAdminClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";
import { z } from "zod";
import type { Question } from "@/types";

export const maxDuration = 30;

const schema = z.object({ session_id: uuid, question_id: uuid });

export async function POST(req: Request) {
  const body = await parseBody(req, schema);
  if ("error" in body) return body.error;
  const db = createAdminClient();
  const { data: session } = await db
    .from("sessions")
    .select("form_id,status")
    .eq("id", body.data.session_id)
    .maybeSingle();
  if (!session || session.status !== "in_progress") return fail("Session is not active", 404);
  const { data: question } = await db
    .from("questions")
    .select("id,question_text,question_type,options,is_required")
    .eq("id", body.data.question_id)
    .eq("form_id", session.form_id)
    .maybeSingle();
  if (!question) return fail("Question not found", 404);
  try {
    return NextResponse.json({ explanation: await explainQuestion(question as Question) });
  } catch (e) {
    console.error("explain-question failed:", e instanceof Error ? e.message : "unknown");
    return fail("The assistant is unavailable right now.", 502);
  }
}
