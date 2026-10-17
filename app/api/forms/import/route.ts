import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, getCreator, newSlug, parseBody } from "@/lib/api";
import { GoogleFormError, importGoogleForm } from "@/lib/google-forms";

export const maxDuration = 30;

const schema = z.object({ url: z.string().trim().min(1).max(500) });

/** Imports a public Google Form: reads its questions and publishes a voice version. */
export async function POST(req: Request) {
  const { supabase, user } = await getCreator();
  if (!user) return fail("Unauthorized", 401);
  const body = await parseBody(req, schema);
  if ("error" in body) return body.error;

  let imported;
  try {
    imported = await importGoogleForm(body.data.url);
  } catch (e) {
    if (e instanceof GoogleFormError) return fail(e.message, 422);
    console.error("google import failed:", e instanceof Error ? e.message : "unknown");
    return fail("Could not import this form. Please try again.", 502);
  }

  const slug = newSlug();
  const { data: form, error } = await supabase
    .from("forms")
    .insert({
      title: imported.title,
      description: imported.description,
      created_by: user.id,
      is_published: true,
      public_slug: slug,
      source: "google",
      google_form_id: imported.google_form_id,
      google_page_count: imported.page_count,
    })
    .select("id")
    .single();
  if (error || !form) return fail("Could not save the imported form", 500);

  const rows = imported.questions.map((q, i) => ({
    form_id: form.id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options,
    is_required: q.is_required,
    position: i,
    google_entry_id: q.google_entry_id,
  }));
  const { error: qErr } = await supabase.from("questions").insert(rows);
  if (qErr) {
    await supabase.from("forms").delete().eq("id", form.id);
    return fail("Could not save the imported questions", 500);
  }
  return NextResponse.json(
    { id: form.id, slug, title: imported.title, count: rows.length, warnings: imported.warnings },
    { status: 201 },
  );
}
