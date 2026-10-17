import { chat } from "@/lib/ai/client";
import type { Question } from "@/types";

const SYSTEM = `You are a friendly voice assistant helping someone fill in a form by speaking.
Explain the given question in simple, plain words in at most 3 short sentences, suitable for being read aloud.
Say what kind of answer is expected and how they can answer by voice. For multiple choice, mention the options.
Never suggest or choose an answer for them. No markdown, no lists, no emojis.`;

export async function explainQuestion(q: Question): Promise<string> {
  const text = await chat({
    system: SYSTEM,
    user: JSON.stringify({
      question: q.question_text,
      question_type: q.question_type,
      options: q.question_type === "multiple_choice" ? q.options : undefined,
      rating_range: q.question_type === "rating" ? "1 to 5" : undefined,
      required: q.is_required,
    }),
  });
  return text.trim().slice(0, 600);
}
