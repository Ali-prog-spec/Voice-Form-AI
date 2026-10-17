import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { getPublicForm } from "@/lib/forms";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{4,32}$/.test(slug)) return fail("Not found", 404);
  const form = await getPublicForm(slug);
  return form ? NextResponse.json(form) : fail("Not found", 404);
}
