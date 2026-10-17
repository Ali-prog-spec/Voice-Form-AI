import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { createClient } from "@/lib/supabase/server";

export const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

/** Signed-in creator or null. API routes are not covered by the page middleware. */
export async function getCreator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { error: fail("Invalid JSON body") };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { error: fail(parsed.error.issues[0]?.message ?? "Invalid request") };
  }
  return { data: parsed.data };
}

export function newSlug() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}
