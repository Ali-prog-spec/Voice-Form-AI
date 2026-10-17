import type { Question } from "@/types";

type Session = {
  id: string;
  completed_at: string;
  responses: { question_id: string; ai_answer: string | number | null }[];
};

export default function ResponsesTable({ questions, sessions }: { questions: Question[]; sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="card mt-6 text-center text-slate-400 py-12">
        <p className="text-base font-semibold text-slate-300">No responses recorded yet</p>
        <p className="text-xs text-slate-500 mt-1">Share your public link to start collecting voice answers.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08] bg-[#121316] shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-900/60 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Submitted</th>
              {questions.map((q) => (
                <th key={q.id} className="min-w-40 px-4 py-3 font-semibold text-zinc-300">
                  {q.question_text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sessions.map((s) => {
              const byQ = new Map(s.responses.map((r) => [r.question_id, r.ai_answer]));
              return (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors align-top">
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs font-mono text-zinc-400">
                    {new Date(s.completed_at).toLocaleString()}
                  </td>
                  {questions.map((q) => {
                    const ans = byQ.get(q.id);
                    return (
                      <td key={q.id} className="px-4 py-3.5 text-zinc-200">
                        {ans !== null && ans !== undefined && ans !== "" ? (
                          <span className="inline-block rounded bg-zinc-900 px-2 py-0.5 text-xs text-zinc-200 border border-white/[0.06]">
                            {String(ans)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
