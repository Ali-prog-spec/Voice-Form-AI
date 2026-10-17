import { chat } from "@/lib/ai/client";
import { aiOutputSchema } from "@/lib/validation/schemas";
import { normalizeAnswer } from "@/lib/validation/answers";
import type { AiResult, AnswerValue, Question } from "@/types";

const SYSTEM = `You apply a spoken correction to an answer that was already filled into a form.

You receive: the question, its type and options, the CURRENT answer, and what the user just said (the correction).

Rules:
1. Change only what the user asked to change; keep everything else in the current answer exactly as it is.
2. Understand corrections like "it's isb not isp", "replace X with Y", "change the last word to ...", "add ... at the end", "remove ...", "make it ...", and full re-statements ("actually it is ...").
3. Spoken spelling: letters said one by one ("i s b", "I as in India, S as in Sierra") become those letters joined together. Keep the original letter case style of the current answer unless told otherwise.
4. Spoken symbols: "at" -> @, "dot" -> ., "dash"/"hyphen" -> -, "underscore" -> _, "slash" -> / when the field is an email, ID, URL or code. Never use these conversions in ordinary prose.
5. For multiple choice, the result must be exactly one of the supplied options. For yes/no return Yes or No. For rating return an integer 1-5. For number return a number.
6. Never invent information the user did not say. If the correction is unclear, return the CURRENT answer unchanged with needs_confirmation=true.
7. Return strict JSON: {"answer": string|number, "confidence": number 0-1, "needs_confirmation": boolean, "reason": string}`;

export async function editAnswer(
  question: Question,
  current: AnswerValue,
  correction: string,
): Promise<AiResult> {
  const content = await chat({
    system: SYSTEM,
    json: true,
    user: JSON.stringify({
      question: question.question_text,
      question_type: question.question_type,
      options: question.question_type === "multiple_choice" ? question.options : undefined,
      current_answer: current,
      user_said: correction,
    }),
  });

  const unchanged: AiResult = {
    answer: current,
    confidence: 0.3,
    needs_confirmation: true,
    reason: "Could not understand the correction.",
  };
  let parsed;
  try {
    parsed = aiOutputSchema.safeParse(JSON.parse(content));
  } catch {
    return unchanged;
  }
  if (!parsed.success) return unchanged;
  const answer = normalizeAnswer(question, parsed.data.answer);
  if (answer === null) return unchanged;
  return {
    answer,
    confidence: parsed.data.confidence,
    needs_confirmation: parsed.data.needs_confirmation || parsed.data.confidence < 0.75,
    reason: parsed.data.reason,
  };
}
