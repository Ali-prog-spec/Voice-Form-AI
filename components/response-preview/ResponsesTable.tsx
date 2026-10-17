import type { Question } from "@/types";

type Session = {
  id: string;
  completed_at: string;
  responses: { question_id: string; ai_answer: string | number | null }[];
};

export default function ResponsesTable({ questions, sessions }: { questions: Question[]; sessions: Session[] }) {
  if (sessions.length === 0) {
    return <div className="card mt-6 text-center text-slate-600">No responses yet. Share your public link to collect some.</div>;
  }
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Submitted</th>
            {questions.map((q) => (
              <th key={q.id} className="min-w-40 px-4 py-3 font-medium">{q.question_text}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => {
            const byQ = new Map(s.responses.map((r) => [r.question_id, r.ai_answer]));
            return (
              <tr key={s.id} className="border-t border-slate-100 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(s.completed_at).toLocaleString()}</td>
                {questions.map((q) => (
                  <td key={q.id} className="px-4 py-3">{byQ.get(q.id) ?? <span className="text-slate-300">—</span>}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
