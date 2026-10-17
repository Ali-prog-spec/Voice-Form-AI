import { NextResponse } from "next/server";
import { fail, getCreator, parseBody } from "@/lib/api";
import { getFormWithQuestions, saveQuestions } from "@/lib/forms";
import { formSchema, uuid } from "@/lib/validation/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { supabase, user } = await getCreator();
  if (!user) return fail("Unauthorized", 401);
  if (!uuid.safeParse(id).success) return fail("Invalid id");
  const data = await getFormWithQuestions(supabase, id);
  return data ? NextResponse.json(data) : fail("Not found", 404);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { supabase, user } = await getCreator();
  if (!user) return fail("Unauthorized", 401);
  if (!uuid.safeParse(id).success) return fail("Invalid id");
  const body = await parseBody(req, formSchema);
  if ("error" in body) return body.error;
  const { title, description, questions } = body.data;

  const { data: updated, error } = await supabase
    .from("forms")
    .update({ title, description: description || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return fail("Could not update form", 500);
  if (!updated) return fail("Not found", 404);
  if (await saveQuestions(supabase, id, questions)) return fail("Could not save questions", 500);
  return NextResponse.json({ id });
}
