export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "yes_no",
  "multiple_choice",
  "rating",
  "number",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type AnswerValue = string | number;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  yes_no: "Yes / No",
  multiple_choice: "Multiple choice",
  rating: "Rating (1–5)",
  number: "Number",
};

export interface Question {
  id: string;
  form_id?: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  is_required: boolean;
  position?: number;
}

export interface Form {
  id: string;
  source?: "native" | "google";
  title: string;
  description: string | null;
  is_published: boolean;
  public_slug: string | null;
}

export interface PublicForm {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

export interface AiResult {
  answer: AnswerValue | null;
  confidence: number;
  needs_confirmation: boolean;
  reason: string;
}
