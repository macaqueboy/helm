type ChatRole = "system" | "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const baseUrl = process.env.OPENCODEGO_URL ?? "http://localhost:8800";
const defaultModel = process.env.OPENCODEGO_DEFAULT_MODEL ?? "deepseek-v4-flash";

export async function chatOpenCode(
  messages: ChatMessage[],
  opts?: { model?: string; maxTokens?: number; temperature?: number; signal?: AbortSignal }
): Promise<{ text: string; model: string }> {
  const model = opts?.model ?? defaultModel;
  const res = await fetch(
    `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts?.maxTokens ?? 1024,
        temperature: opts?.temperature ?? 0.7,
        stream: false,
      }),
      signal: opts?.signal,
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenCode error ${res.status}: ${txt}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return { text: data.choices?.[0]?.message?.content ?? "", model };
}
