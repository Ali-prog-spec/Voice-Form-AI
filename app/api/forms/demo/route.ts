import { NextResponse } from "next/server";
import { fail, getCreator, newSlug } from "@/lib/api";
import { DEMO_FORM, saveQuestions } from "@/lib/forms";
import type { Question } from "@/types";

/** Creates and publishes the "SaaS Customer Feedback" demo form for the signed-in creator. */
export async function POST() {
  const { supabase, user } = await getCreator();
  if (!user) return fail("Unauthorized", 401);
  const { data: form, error } = await supabase
    .from("forms")
    .insert({
      title: DEMO_FORM.title,
      description: DEMO_FORM.description,
      created_by: user.id,
      is_published: true,
      public_slug: newSlug(),
    })
    .select("id")
    .single();
  if (error || !form) return fail("Could not create demo form", 500);
  const questions = DEMO_FORM.questions.map((q) => ({
    ...q,
    id: crypto.randomUUID(),
  })) as Omit<Question, "form_id" | "position">[];
  if (await saveQuestions(supabase, form.id, questions)) return fail("Could not save questions", 500);
  return NextResponse.json({ id: form.id }, { status: 201 });
}
