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

  const { data: current } = await supabase.from("forms").select("source").eq("id", id).maybeSingle();
  if (current?.source === "google") return fail("Imported Google Forms cannot be edited here. Re-import the form instead.", 400);

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

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { supabase, user } = await getCreator();
  if (!user) return fail("Unauthorized", 401);
  if (!uuid.safeParse(id).success) return fail("Invalid id");
  // RLS limits this to the signed-in owner; questions, sessions and responses cascade.
  const { data, error } = await supabase.from("forms").delete().eq("id", id).select("id");
  if (error) return fail("Could not delete form", 500);
  if (!data?.length) return fail("Not found", 404);
  return NextResponse.json({ ok: true });
}
