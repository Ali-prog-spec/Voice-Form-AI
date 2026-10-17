"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyLinkButton } from "@/components/ui/DashboardActions";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type Form, type Question, type QuestionType } from "@/types";

type Draft = Omit<Question, "form_id" | "position">;

const blank = (): Draft => ({
  id: crypto.randomUUID(),
  question_text: "",
  question_type: "short_text",
  options: null,
  is_required: true,
});

export default function FormBuilder({ form, questions }: { form?: Form; questions?: Question[] }) {
  const router = useRouter();
  const [id, setId] = useState(form?.id);
  const [title, setTitle] = useState(form?.title ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [qs, setQs] = useState<Draft[]>(questions?.length ? questions : [blank()]);
  const [published, setPublished] = useState(form?.is_published ?? false);
  const [slug, setSlug] = useState(form?.public_slug ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (i: number, patch: Partial<Draft>) =>
    setQs((all) => all.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, d: number) =>
    setQs((all) => {
      const next = [...all];
      const j = i + d;
      if (j < 0 || j >= next.length) return all;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function save(): Promise<string | null> {
    const payload = {
      title,
      description,
      questions: qs.map((q) => ({
        ...q,
        options: q.question_type === "multiple_choice" ? (q.options ?? []).map((o) => o.trim()).filter(Boolean) : null,
      })),
    };
    const res = await fetch(id ? `/api/forms/${id}` : "/api/forms", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!res?.ok) {
      setMsg({ ok: false, text: json?.error ?? "Network error. Please try again." });
      return null;
    }
    setId(json.id);
    if (!id) router.replace(`/forms/${json.id}`);
    return json.id as string;
  }

  async function onSave() {
    setBusy(true);
    setMsg(null);
    if (await save()) setMsg({ ok: true, text: "Saved." });
    setBusy(false);
  }

  async function onPublish(publish: boolean) {
    setBusy(true);
    setMsg(null);
    const formId = await save();
    if (formId) {
      const res = await fetch(`/api/forms/${formId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: publish }),
      }).catch(() => null);
      const json = await res?.json().catch(() => null);
      if (res?.ok) {
        setPublished(json.is_published);
        setSlug(json.public_slug);
        setMsg({ ok: true, text: publish ? "Published!" : "Unpublished." });
      } else setMsg({ ok: false, text: json?.error ?? "Could not publish." });
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">← Back to Dashboard</Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">{form ? "Edit form" : "New form"}</h1>

      <section className="card mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Title
          <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </label>
        <label className="block text-sm font-medium">
          Description
          <textarea className="input mt-1" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </section>

      <ol className="mt-6 space-y-4">
        {qs.map((q, i) => (
          <li key={q.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Question {i + 1}</span>
              <div className="flex gap-1">
                <button className="btn-secondary px-2.5 py-1.5" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button className="btn-secondary px-2.5 py-1.5" aria-label="Move down" disabled={i === qs.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button className="btn-danger px-2.5 py-1.5" onClick={() => setQs((all) => all.filter((_, j) => j !== i))}>Delete</button>
              </div>
            </div>
            <input
              className="input"
              placeholder="Question text"
              aria-label="Question text"
              value={q.question_text}
              onChange={(e) => update(i, { question_text: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-4">
              <select
                className="input w-auto"
                aria-label="Question type"
                value={q.question_type}
                onChange={(e) => {
                  const t = e.target.value as QuestionType;
                  update(i, { question_type: t, options: t === "multiple_choice" ? (q.options ?? ["", ""]) : null });
                }}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={q.is_required} onChange={(e) => update(i, { is_required: e.target.checked })} />
                Required
              </label>
            </div>
            {q.question_type === "multiple_choice" && (
              <label className="block text-sm font-medium">
                Options (one per line)
                <textarea
                  className="input mt-1"
                  rows={4}
                  value={(q.options ?? []).join("\n")}
                  onChange={(e) => update(i, { options: e.target.value.split("\n") })}
                />
              </label>
            )}
          </li>
        ))}
      </ol>

      <button className="btn-secondary mt-4" onClick={() => setQs((all) => [...all, blank()])}>+ Add question</button>

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-white/[0.08] bg-[#0c1222]/95 px-4 py-4 backdrop-blur-md">
        {msg && (
          <p role="status" className={`mb-2 text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary" disabled={busy} onClick={onSave}>Save draft</button>
          <button className="btn-primary" disabled={busy} onClick={() => onPublish(true)}>
            {published ? "Save & keep published" : "Publish"}
          </button>
          {published && (
            <button className="btn-danger" disabled={busy} onClick={() => onPublish(false)}>Unpublish</button>
          )}
          {published && slug && (
            <>
              <CopyLinkButton slug={slug} />
              <Link href={`/f/${slug}`} target="_blank" className="btn-secondary">Open</Link>
            </>
          )}
          {id && <Link href={`/forms/${id}/responses`} className="btn-secondary">Responses</Link>}
        </div>
      </div>
    </main>
  );
}
