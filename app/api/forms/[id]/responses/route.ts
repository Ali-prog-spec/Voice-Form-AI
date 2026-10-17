import { NextResponse } from "next/server";
import { fail, getCreator } from "@/lib/api";
import { getFormWithQuestions, getResponsesData } from "@/lib/forms";
import { uuid } from "@/lib/validation/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getCreator();
  if (!user) return fail("Unauthorized", 401);
  if (!uuid.safeParse(id).success) return fail("Invalid id");
  const data = await getFormWithQuestions(supabase, id);
  if (!data) return fail("Not found", 404);
  return NextResponse.json({ ...data, sessions: await getResponsesData(supabase, id) });
}
