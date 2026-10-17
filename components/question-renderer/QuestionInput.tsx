"use client";

import type { AnswerValue, Question } from "@/types";

interface Props {
  question: Question;
  value: AnswerValue | null;
  onChange: (v: AnswerValue | null) => void;
}

const choice = (active: boolean) =>
  `btn border transition-colors ${
    active
      ? "border-blue-500 bg-blue-600/20 text-white font-medium ring-1 ring-blue-500/40"
      : "border-white/[0.08] bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-white/[0.14]"
  }`;

export default function QuestionInput({ question: q, value, onChange }: Props) {
  switch (q.question_type) {
    case "short_text":
      return (
        <input className="input" aria-label={q.question_text} value={String(value ?? "")} maxLength={500} onChange={(e) => onChange(e.target.value)} />
      );
    case "long_text":
      return (
        <textarea className="input" rows={5} aria-label={q.question_text} value={String(value ?? "")} maxLength={5000} onChange={(e) => onChange(e.target.value)} />
      );
    case "number":
      return (
        <input
          className="input"
          type="number"
          aria-label={q.question_text}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "yes_no":
      return (
        <div className="flex gap-3">
          {["Yes", "No"].map((o) => (
            <button key={o} type="button" className={`${choice(value === o)} flex-1`} onClick={() => onChange(o)}>{o}</button>
          ))}
        </div>
      );
    case "rating":
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} out of 5`} className={`${choice(value === n)} flex-1`} onClick={() => onChange(n)}>{n}</button>
          ))}
        </div>
      );
    case "multiple_choice":
      return (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={q.question_text}>
          {(q.options ?? []).map((o) => (
            <button key={o} type="button" role="radio" aria-checked={value === o} className={`${choice(value === o)} justify-start`} onClick={() => onChange(o)}>{o}</button>
          ))}
        </div>
      );
  }
}
