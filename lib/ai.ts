// lib/ai.ts — LLM integration with OpenAI-compatible tool calling
// Connects directly to OpenCode Go or custom OPENCODEGO_URL

type ChatRole = "system" | "user" | "assistant" | "tool";

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

interface ChatMessage {
  role: ChatRole;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string; // for role: "tool" messages
  name?: string; // for role: "tool" messages
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

type ToolExecutor = (
  args: Record<string, unknown>,
  context: ToolContext
) => Promise<string>;

export interface ToolContext {
  channelId: string;
  agentId: string;
  workspaceId: string;
  userId: string;
  agentName: string;
}

const DEFAULT_OPENCODE_KEY = "sk-44S...ZRff";

const rawKey = process.env.OPENCODE_GO_API_KEY ?? process.env.OPENCODE_API_KEY;
const apiKey = rawKey && rawKey.trim().length > 10 ? rawKey.trim() : DEFAULT_OPENCODE_KEY;

const rawUrl = process.env.OPENCODEGO_URL;
const baseUrl = rawUrl && !rawUrl.includes("127.0.0.1") && !rawUrl.includes("localhost")
  ? rawUrl.replace(/\/$/, "")
  : "https://opencode.ai/zen/go/v1";

const defaultModel = process.env.OPENCODEGO_DEFAULT_MODEL ?? "deepseek-v4-flash";

/**
 * Core LLM call — sends messages + tools, returns response
 */
async function llmCall(
  messages: ChatMessage[],
  opts?: {
    model?: string;
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
    signal?: AbortSignal;
  }
): Promise<{
  content: string | null;
  tool_calls?: ToolCall[];
  model: string;
}> {
  const model = opts?.model ?? defaultModel;
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: opts?.maxTokens ?? 4096,
    temperature: opts?.temperature ?? 0.7,
    stream: false,
  };

  if (opts?.tools && opts.tools.length > 0) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }

  // Ensure path ends with /chat/completions correctly
  const endpoint = baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(body),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenCode error ${res.status}: ${txt}`);
  }

  const data = (await res.json()) as {
    choices?: {
      message?: {
        content?: string | null;
        tool_calls?: ToolCall[];
      };
      finish_reason?: string;
    }[];
  };

  const choice = data.choices?.[0];
  return {
    content: choice?.message?.content ?? null,
    tool_calls: choice?.message?.tool_calls,
    model,
  };
}

/**
 * Full agent loop with tool calling.
 * 1. Send messages + tools to LLM
 * 2. If LLM returns tool_calls → execute each → add results → loop
 * 3. If LLM returns content → return final text
 * Max 10 iterations to prevent infinite loops.
 */
export async function agentLoop(
  messages: ChatMessage[],
  opts: {
    model?: string;
    tools?: ToolDefinition[];
    toolExecutors?: Record<string, ToolExecutor>;
    toolContext?: ToolContext;
    maxIterations?: number;
    signal?: AbortSignal;
  }
): Promise<{ text: string; model: string; toolCallsMade: string[] }> {
  const maxIter = opts.maxIterations ?? 10;
  const toolCallsMade: string[] = [];
  let conversation = [...messages];

  for (let i = 0; i < maxIter; i++) {
    const response = await llmCall(conversation, {
      model: opts.model,
      tools: opts.tools,
      signal: opts.signal,
    });

    // No tool calls → return final content
    if (!response.tool_calls || response.tool_calls.length === 0) {
      return {
        text: response.content ?? "",
        model: response.model,
        toolCallsMade,
      };
    }

    // Add assistant message with tool_calls to conversation
    conversation.push({
      role: "assistant",
      content: response.content,
      tool_calls: response.tool_calls,
    });

    // Execute each tool call
    for (const tc of response.tool_calls) {
      const toolName = tc.function.name;
      toolCallsMade.push(toolName);

      let result: string;
      try {
        const args = JSON.parse(tc.function.arguments || "{}");
        const executor = opts.toolExecutors?.[toolName];

        if (!executor) {
          result = `Error: tool "${toolName}" not found`;
        } else {
          result = await executor(args, opts.toolContext ?? ({} as ToolContext));
        }
      } catch (err) {
        result = `Error executing ${toolName}: ${err instanceof Error ? err.message : String(err)}`;
      }

      conversation.push({
        role: "tool",
        content: result,
        tool_call_id: tc.id,
        name: toolName,
      });
    }
  }

  // Max iterations reached — force a final response without tools
  const final = await llmCall(conversation, {
    model: opts.model,
    signal: opts.signal,
  });

  return {
    text: final.content ?? "Reached max tool calls. Here's what I found so far.",
    model: final.model,
    toolCallsMade,
  };
}

/**
 * Simple chat without tools (for backwards compat)
 */
export async function chatOpenCode(
  messages: ChatMessage[],
  opts?: { model?: string; maxTokens?: number; temperature?: number; signal?: AbortSignal }
): Promise<{ text: string; model: string }> {
  const cleanMessages = messages.filter((m) => m.role !== "tool" && !m.tool_calls);
  const response = await llmCall(cleanMessages, opts);
  return { text: response.content ?? "", model: response.model };
}

export { llmCall };
export type { ChatMessage, ChatRole, ToolCall };
