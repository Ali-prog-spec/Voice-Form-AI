import { notFound } from "next/navigation";
import FormBuilder from "@/components/form-builder/FormBuilder";
import { getFormWithQuestions } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const data = await getFormWithQuestions(await createClient(), id);
  if (!data) notFound();
  return <FormBuilder form={data.form} questions={data.questions} />;
}
