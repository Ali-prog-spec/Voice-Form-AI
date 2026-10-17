import type { AnswerValue, Question } from "@/types";

type QuestionShape = Pick<Question, "question_type" | "options">;

/** Validate + normalize a raw answer against the question definition. Returns null if invalid. */
export function normalizeAnswer(q: QuestionShape, raw: unknown): AnswerValue | null {
  if (raw === null || raw === undefined) return null;
  switch (q.question_type) {
    case "short_text":
    case "long_text": {
      if (typeof raw !== "string") return null;
      const s = raw.trim();
      const max = q.question_type === "short_text" ? 500 : 5000;
      return s.length > 0 && s.length <= max ? s : null;
    }
    case "yes_no": {
      const s = String(raw).trim().toLowerCase();
      if (["yes", "y", "true"].includes(s)) return "Yes";
      if (["no", "n", "false"].includes(s)) return "No";
      return null;
    }
    case "multiple_choice": {
      if (typeof raw !== "string") return null;
      const s = raw.trim().toLowerCase();
      return (q.options ?? []).find((o) => o.trim().toLowerCase() === s) ?? null;
    }
    case "rating": {
      const n = typeof raw === "string" && raw.trim() === "" ? NaN : Number(raw);
      return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
    }
    case "number": {
      const n = typeof raw === "string" && raw.trim() === "" ? NaN : Number(raw);
      return Number.isFinite(n) && Math.abs(n) < 1e12 ? n : null;
    }
    default:
      return null;
  }
}

export function formatAnswer(q: QuestionShape, value: AnswerValue): string {
  return q.question_type === "rating" ? `${value} / 5` : String(value);
}
