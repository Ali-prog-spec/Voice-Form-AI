import { aiOutputSchema } from "@/lib/validation/schemas";
import { normalizeAnswer } from "@/lib/validation/answers";
import type { AiResult, Question } from "@/types";

const SYSTEM_PROMPT = `You are a form-response extraction assistant.

Interpret the user's spoken response only in the context of the supplied question.

Preserve the user's meaning, remove filler and repetition, and never invent facts.

Rules:

1. Answer only the current question.
2. For multiple choice, select exactly one option from the supplied options.
3. For yes/no, return Yes or No when the meaning is clear.
4. For rating, return an integer within the allowed range.
5. For number fields, extract the number when clearly stated.
6. If the response is ambiguous, insufficient, or conflicts with the available choices, set needs_confirmation=true.
7. Do not add information that the user did not say.
8. Return strict JSON matching the requested schema.

Be question-aware: for text questions, keep only the part of the speech that answers the question
(e.g. for "What could we improve?" omit praise). If nothing answers the question, use answer=null.

Output JSON schema: {"answer": string|number|null, "confidence": number 0-1, "needs_confirmation": boolean, "reason": string}`;

const FALLBACK: AiResult = {
  answer: null,
  confidence: 0,
  needs_confirmation: true,
  reason: "Could not interpret the response.",
};

const LOW_CONFIDENCE = 0.75;

/** Provider-specific: Groq (OpenAI-compatible) chat completions. Swap this function to change providers. */
async function callModel(userPayload: unknown): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

export async function extractAnswer(question: Question, transcript: string): Promise<AiResult> {
  const content = await callModel({
    question: question.question_text,
    question_type: question.question_type,
    options: question.question_type === "multiple_choice" ? question.options : undefined,
    rating_range: question.question_type === "rating" ? { min: 1, max: 5 } : undefined,
    is_required: question.is_required,
    transcript,
  });

  let parsed;
  try {
    parsed = aiOutputSchema.safeParse(JSON.parse(content));
  } catch {
    return FALLBACK;
  }
  if (!parsed.success) return FALLBACK;

  const out = parsed.data;
  const answer = normalizeAnswer(question, out.answer);
  if (answer === null) {
    return {
      answer: null,
      confidence: Math.min(out.confidence, 0.4),
      needs_confirmation: true,
      reason: out.answer === null ? out.reason : "The suggested answer was not valid for this question.",
    };
  }
  return {
    answer,
    confidence: out.confidence,
    needs_confirmation: out.needs_confirmation || out.confidence < LOW_CONFIDENCE,
    reason: out.reason,
  };
}
