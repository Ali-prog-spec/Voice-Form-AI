import { NextResponse } from "next/server";
import { fail, getCreator, newSlug } from "@/lib/api";
import { uuid } from "@/lib/validation/schemas";

/** Body (optional): { published: boolean } — defaults to publishing. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getCreator();
  if (!user) return fail("Unauthorized", 401);
  if (!uuid.safeParse(id).success) return fail("Invalid id");
  const body = await req.json().catch(() => ({}));
  const published = body?.published !== false;

  const { data: form } = await supabase.from("forms").select("public_slug").eq("id", id).maybeSingle();
  if (!form) return fail("Not found", 404);
  if (published) {
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("form_id", id);
    if (!count) return fail("Add at least one question before publishing");
  }
  const slug = form.public_slug ?? newSlug();
  const { error } = await supabase
    .from("forms")
    .update({ is_published: published, public_slug: slug, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail("Could not publish", 500);
  return NextResponse.json({ is_published: published, public_slug: slug });
}
