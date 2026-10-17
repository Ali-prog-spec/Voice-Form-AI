import { NextResponse } from "next/server";
import { fail, getCreator, parseBody } from "@/lib/api";
import { saveQuestions } from "@/lib/forms";
import { formSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  const { supabase, user } = await getCreator();
  if (!user) return fail("Unauthorized", 401);
  const body = await parseBody(req, formSchema);
  if ("error" in body) return body.error;
  const { title, description, questions } = body.data;

  const { data: form, error } = await supabase
    .from("forms")
    .insert({ title, description: description || null, created_by: user.id })
    .select("id")
    .single();
  if (error || !form) return fail("Could not create form", 500);
  const qErr = await saveQuestions(supabase, form.id, questions);
  if (qErr) return fail("Could not save questions", 500);
  return NextResponse.json({ id: form.id }, { status: 201 });
}
