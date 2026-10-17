import { z } from "zod";
import { QUESTION_TYPES } from "@/types";

export const questionSchema = z
  .object({
    id: z.string().uuid(),
    question_text: z.string().trim().min(1, "Question text is required").max(500),
    question_type: z.enum(QUESTION_TYPES),
    options: z.array(z.string().trim().min(1).max(100)).max(20).nullable().optional(),
    is_required: z.boolean(),
  })
  .superRefine((q, ctx) => {
    if (q.question_type === "multiple_choice" && (q.options?.length ?? 0) < 2) {
      ctx.addIssue({ code: "custom", message: "Multiple choice needs at least 2 options" });
    }
  });

export const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  questions: z.array(questionSchema).max(50),
});

export const uuid = z.string().uuid();

export const createSessionSchema = z.object({ form_id: uuid });

export const processAnswerSchema = z.object({
  session_id: uuid,
  question_id: uuid,
  transcript: z.string().trim().min(1).max(5000),
});

export const saveResponseSchema = z.object({
  session_id: uuid,
  question_id: uuid,
  raw_transcript: z.string().max(5000).nullable().optional(),
  answer: z.union([z.string(), z.number()]).nullable(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  was_edited: z.boolean().default(false),
});

export const aiOutputSchema = z.object({
  answer: z.union([z.string(), z.number(), z.null()]),
  confidence: z.number().min(0).max(1),
  needs_confirmation: z.boolean(),
  reason: z.string().max(1000).default(""),
});
