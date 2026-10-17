import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";

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
  if (session.status === "completed") return NextResponse.json({ ok: true });

  const [{ data: required }, { data: answered }] = await Promise.all([
    db.from("questions").select("id").eq("form_id", session.form_id).eq("is_required", true),
    db.from("responses").select("question_id").eq("session_id", id).not("ai_answer", "is", null),
  ]);
  const done = new Set((answered ?? []).map((r) => r.question_id));
  if ((required ?? []).some((q) => !done.has(q.id))) {
    return fail("Please answer all required questions");
  }

  const { error } = await db
    .from("sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail("Could not submit", 500);
  return NextResponse.json({ ok: true });
}
