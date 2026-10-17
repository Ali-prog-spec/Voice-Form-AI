import { NextResponse } from "next/server";
import { fail, parseBody } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server";
import { createSessionSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  const body = await parseBody(req, createSessionSchema);
  if ("error" in body) return body.error;
  const db = createAdminClient();
  const { data: form } = await db
    .from("forms")
    .select("id")
    .eq("id", body.data.form_id)
    .eq("is_published", true)
    .maybeSingle();
  if (!form) return fail("Form not found", 404);
  const { data: session, error } = await db
    .from("sessions")
    .insert({ form_id: form.id })
    .select("id")
    .single();
  if (error || !session) return fail("Could not start session", 500);
  return NextResponse.json({ id: session.id }, { status: 201 });
}
