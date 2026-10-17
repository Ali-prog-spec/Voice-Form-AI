import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import type { Form, PublicForm, Question } from "@/types";

type QuestionInput = Omit<Question, "form_id" | "position" | "options"> & { options?: string[] | null };

/** Upsert the given questions (keeping ids, so existing responses survive) and delete the rest. */
export async function saveQuestions(db: SupabaseClient, formId: string, questions: QuestionInput[]) {
  const rows = questions.map((q, i) => ({
    id: q.id,
    form_id: formId,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.question_type === "multiple_choice" ? (q.options ?? null) : null,
    is_required: q.is_required,
    position: i,
  }));
  const { data: existing, error: e1 } = await db.from("questions").select("id").eq("form_id", formId);
  if (e1) return e1;
  const keep = new Set(rows.map((r) => r.id));
  const remove = (existing ?? []).map((r) => r.id as string).filter((id) => !keep.has(id));
  if (remove.length) {
    const { error } = await db.from("questions").delete().eq("form_id", formId).in("id", remove);
    if (error) return error;
  }
  if (rows.length) {
    const { error } = await db.from("questions").upsert(rows);
    if (error) return error;
  }
  return null;
}

export async function getFormWithQuestions(db: SupabaseClient, id: string) {
  const { data: form } = await db
    .from("forms")
    .select("id,title,description,is_published,public_slug,source,google_form_id")
    .eq("id", id)
    .maybeSingle();
  if (!form) return null;
  const { data: questions } = await db
    .from("questions")
    .select("id,question_text,question_type,options,is_required,position")
    .eq("form_id", id)
    .order("position");
  return { form: form as Form, questions: (questions ?? []) as Question[] };
}

/** Public view: published forms only, no creator data. */
export async function getPublicForm(slug: string): Promise<PublicForm | null> {
  const db = createAdminClient();
  const { data: form } = await db
    .from("forms")
    .select("id,title,description")
    .eq("public_slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!form) return null;
  const { data: questions } = await db
    .from("questions")
    .select("id,question_text,question_type,options,is_required,position")
    .eq("form_id", form.id)
    .order("position");
  return { ...form, questions: (questions ?? []) as Question[] } as PublicForm;
}

export async function getResponsesData(db: SupabaseClient, formId: string) {
  const { data: sessions } = await db
    .from("sessions")
    .select("id,completed_at,responses(question_id,ai_answer,confidence,was_edited)")
    .eq("form_id", formId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });
  return (sessions ?? []) as unknown as {
    id: string;
    completed_at: string;
    responses: { question_id: string; ai_answer: string | number | null; confidence: number | null; was_edited: boolean }[];
  }[];
}

export const DEMO_FORM = {
  title: "SaaS Customer Feedback",
  description: "Tell us what you think — just speak your answers.",
  questions: [
    { question_text: "What is your role?", question_type: "multiple_choice", options: ["Student", "Software Developer", "Designer", "Business Owner", "Other"], is_required: true },
    { question_text: "How long have you used our product? (in months)", question_type: "number", options: null, is_required: true },
    { question_text: "What do you like most about it?", question_type: "long_text", options: null, is_required: true },
    { question_text: "What could we improve?", question_type: "long_text", options: null, is_required: false },
    { question_text: "How satisfied are you from 1 to 5?", question_type: "rating", options: null, is_required: true },
    { question_text: "Would you recommend it to a colleague?", question_type: "yes_no", options: null, is_required: true },
  ],
};
