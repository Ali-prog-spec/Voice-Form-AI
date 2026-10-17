import type { QuestionType } from "@/types";

/**
 * Google Forms import/submit helpers.
 *
 * There is no official API to *submit* responses, and the official read API needs the owner's OAuth.
 * So we use the same public endpoints a browser uses: the public `viewform` page embeds the form
 * definition (FB_PUBLIC_LOAD_DATA_) and `formResponse` accepts `entry.<id>=<value>` posts.
 * This is unofficial and may break if Google changes its markup — callers must handle failure.
 */

export interface ImportedQuestion {
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  is_required: boolean;
  google_entry_id: string;
}

export interface ImportedForm {
  google_form_id: string;
  title: string;
  description: string | null;
  page_count: number;
  questions: ImportedQuestion[];
  warnings: string[];
}

export class GoogleFormError extends Error {}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

const ALLOWED_HOSTS = new Set(["docs.google.com", "forms.gle", "forms.google.com"]);

/** Validate the pasted link (SSRF guard: Google hosts over https only). */
export function parseGoogleFormUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new GoogleFormError("That doesn't look like a link. Paste the Google Form's share link.");
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new GoogleFormError("Please paste a Google Forms link (docs.google.com/forms/… or forms.gle/…).");
  }
  return url;
}

type Raw = unknown[];
const arr = (v: unknown): Raw => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

const TYPE_SHORT = 0;
const TYPE_PARAGRAPH = 1;
const TYPE_CHOICE = 2;
const TYPE_DROPDOWN = 3;
const TYPE_CHECKBOX = 4;
const TYPE_SCALE = 5;
const TYPE_SECTION = 8;
const UNSUPPORTED: Record<number, string> = {
  7: "grid",
  9: "date",
  10: "time",
  13: "file upload",
  18: "star rating",
};

/** Pure parser over the viewform HTML — exported for testing. */
export function parseViewformHtml(html: string, formId: string): ImportedForm {
  const m = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\])\s*;\s*<\/script>/);
  if (!m) throw new GoogleFormError("Could not read this form. Make sure it's public and doesn't require sign-in.");
  let data: Raw;
  try {
    data = JSON.parse(m[1]);
  } catch {
    throw new GoogleFormError("Could not read this form's structure.");
  }

  const meta = arr(data[1]);
  const title =
    str(data[3]) || str(meta[8]) || html.match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/ - Google Forms$/, "") || "Imported form";
  const description = str(meta[0]) || null;

  const warnings: string[] = [];
  const questions: ImportedQuestion[] = [];
  let pages = 1;

  for (const raw of arr(meta[1])) {
    const item = arr(raw);
    const text = (str(item[1]) || "Untitled question").trim().slice(0, 500);
    const type = Number(item[3]);
    if (type === TYPE_SECTION) {
      pages++;
      continue;
    }
    const q = arr(arr(item[4])[0]);
    if (q.length === 0 || q[0] == null) continue; // image / video / text block

    if (type in UNSUPPORTED) {
      warnings.push(`"${text}" is a ${UNSUPPORTED[type]} question and can't be answered by voice yet — it was skipped.`);
      continue;
    }
    const entry = String(q[0]);
    const required = q[2] === 1;
    const rawOptions = arr(q[1]).map((o) => arr(o));
    const labels = rawOptions.filter((o) => o[4] !== 1).map((o) => str(o[0]).trim()).filter(Boolean).slice(0, 50);

    let question_type: QuestionType;
    let options: string[] | null = null;
    switch (type) {
      case TYPE_SHORT:
        question_type = "short_text";
        break;
      case TYPE_PARAGRAPH:
        question_type = "long_text";
        break;
      case TYPE_CHECKBOX:
        warnings.push(`"${text}" allows several selections; voice will pick one.`);
      // falls through
      case TYPE_CHOICE:
      case TYPE_DROPDOWN:
        if (labels.length === 0) {
          question_type = "short_text";
        } else {
          question_type = "multiple_choice";
          options = labels;
        }
        break;
      case TYPE_SCALE: {
        const nums = labels.map(Number);
        const isOneToFive = nums.length === 5 && nums.every((n, i) => n === i + 1);
        if (isOneToFive) question_type = "rating";
        else if (labels.length > 0) {
          question_type = "multiple_choice";
          options = labels;
        } else question_type = "number";
        break;
      }
      default:
        warnings.push(`"${text}" has an unknown question type and was skipped.`);
        continue;
    }
    questions.push({ question_text: text, question_type, options, is_required: required, google_entry_id: entry });
  }

  if (questions.length === 0) throw new GoogleFormError("No answerable questions were found in this form.");
  if (questions.length > 50) {
    warnings.push("Only the first 50 questions were imported.");
    questions.length = 50;
  }
  return { google_form_id: formId, title: title.slice(0, 200), description, page_count: pages, questions, warnings };
}

export async function importGoogleForm(input: string): Promise<ImportedForm> {
  const url = parseGoogleFormUrl(input);
  let res: Response;
  try {
    res = await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow", signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new GoogleFormError("Could not reach Google Forms. Please try again.");
  }
  const final = new URL(res.url);
  if (final.hostname.includes("accounts.google.com")) {
    throw new GoogleFormError("This form requires signing in to Google, which isn't supported. Allow anyone with the link to respond.");
  }
  if (final.hostname !== "docs.google.com") throw new GoogleFormError("That link doesn't lead to a Google Form.");
  const id = final.pathname.match(/\/forms\/d\/e\/([\w-]+)/)?.[1];
  if (!id) {
    throw new GoogleFormError(
      "Use the respondent link: in Google Forms click Send → link icon, then copy that URL (not the edit URL).",
    );
  }
  if (!res.ok) throw new GoogleFormError("Google Forms could not open this link.");
  const html = (await res.text()).slice(0, 5_000_000);
  return parseViewformHtml(html, id);
}

export interface GoogleAnswer {
  entry_id: string;
  value: string | number;
}

export function buildPrefillUrl(formId: string, answers: GoogleAnswer[]) {
  const p = new URLSearchParams({ usp: "pp_url" });
  for (const a of answers) p.append(`entry.${a.entry_id}`, String(a.value));
  return `https://docs.google.com/forms/d/e/${formId}/viewform?${p}`;
}

/** Posts answers to the form's public formResponse endpoint. Returns true on success. */
export async function submitToGoogle(formId: string, pageCount: number, answers: GoogleAnswer[]): Promise<boolean> {
  const body = new URLSearchParams();
  for (const a of answers) body.append(`entry.${a.entry_id}`, String(a.value));
  body.append("pageHistory", Array.from({ length: Math.max(1, pageCount) }, (_, i) => i).join(","));
  body.append("fvv", "1");
  try {
    const res = await fetch(`https://docs.google.com/forms/d/e/${formId}/formResponse`, {
      method: "POST",
      headers: { ...BROWSER_HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
      body,
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok && new URL(res.url).hostname === "docs.google.com";
  } catch {
    return false;
  }
}
