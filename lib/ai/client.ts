/** Provider-specific chat call (Groq, OpenAI-compatible). Swap this file to change LLM providers. */
export async function chat(opts: { system: string; user: string; json?: boolean; timeoutMs?: number }): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b",
      temperature: opts.json ? 0 : 0.3,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}
