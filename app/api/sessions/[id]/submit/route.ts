import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { buildPrefillUrl, submitToGoogle, type GoogleAnswer } from "@/lib/google-forms";
import { createAdminClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";

/**
 * Completes the session. For imported Google Forms the answers are also posted to the original
 * form; if that fails we still keep the answers and return a pre-filled link so nothing is lost.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) return fail("Invalid id");
  const db = createAdminClient();
  const { data: session } = await db
    .from("sessions")
    .select("id,form_id,status")
    .eq("id", id)
    .maybeSingle();
  if (!session) return fail("Session not found", 404);

  const [{ data: form }, { data: questions }, { data: answered }] = await Promise.all([
    db.from("forms").select("source,google_form_id,google_page_count").eq("id", session.form_id).single(),
    db.from("questions").select("id,is_required,google_entry_id").eq("form_id", session.form_id),
    db.from("responses").select("question_id,ai_answer").eq("session_id", id).not("ai_answer", "is", null),
  ]);
  const answers = new Map((answered ?? []).map((r) => [r.question_id as string, r.ai_answer as string | number]));
  if ((questions ?? []).some((q) => q.is_required && !answers.has(q.id))) {
    return fail("Please answer all required questions");
  }

  if (session.status !== "completed") {
    const { error } = await db
      .from("sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return fail("Could not submit", 500);
  }

  if (form?.source !== "google" || !form.google_form_id) return NextResponse.json({ ok: true });

  const gAnswers: GoogleAnswer[] = (questions ?? [])
    .filter((q) => q.google_entry_id && answers.has(q.id))
    .map((q) => ({ entry_id: q.google_entry_id as string, value: answers.get(q.id)! }));
  const sent = await submitToGoogle(form.google_form_id, form.google_page_count ?? 1, gAnswers);
  return NextResponse.json({
    ok: true,
    google: sent ? "submitted" : "failed",
    prefill_url: sent ? undefined : buildPrefillUrl(form.google_form_id, gAnswers),
  });
}
