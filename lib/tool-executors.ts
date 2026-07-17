import { db, agents, tasks, channels, messages, workspaceMembers } from "@/lib/db";
import { eq, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { ToolContext } from "@/lib/ai";
import type { ToolDefinition } from "@/lib/ai";
import { AGENT_TOOLS } from "@/lib/tools";

// ═════════════════════════════════════════════════════════════
// Tool Executors — each tool the LLM can call
// ═════════════════════════════════════════════════════════════

async function createTask(
  args: { title: string; description?: string },
  ctx: ToolContext
): Promise<string> {
  // Get next task number in channel
  const [{ maxNum }] = await db
    .select({ maxNum: sql<number>`MAX(${tasks.number})` })
    .from(tasks)
    .where(eq(tasks.channelId, ctx.channelId));

  const number = (maxNum ?? 0) + 1;
  const id = randomUUID();

  await db.insert(tasks).values({
    id,
    channelId: ctx.channelId,
    number,
    title: args.title,
    description: args.description ?? null,
    status: "todo",
    agentId: ctx.agentId,
    createdById: ctx.userId,
  });

  return JSON.stringify({
    ok: true,
    task_number: number,
    task_id: id,
    message: `Tarea #${number} creada: "${args.title}"`,
  });
}

async function listTasks(
  args: { status?: string },
  ctx: ToolContext
): Promise<string> {
  let query = db
    .select({
      number: tasks.number,
      title: tasks.title,
      status: tasks.status,
      ownerId: tasks.ownerId,
      agentId: tasks.agentId,
    })
    .from(tasks)
    .where(eq(tasks.channelId, ctx.channelId))
    .orderBy(tasks.number);

  const result = await query;
  const filtered = args.status
    ? result.filter((t) => t.status === args.status)
    : result;

  if (filtered.length === 0) {
    return JSON.stringify({ tasks: [], message: "No hay tareas en este canal" });
  }

  return JSON.stringify({
    tasks: filtered.map((t) => ({
      number: t.number,
      title: t.title,
      status: t.status,
      assigned: t.ownerId || t.agentId ? true : false,
    })),
    count: filtered.length,
  });
}

async function updateTask(
  args: { number: number; status: string },
  ctx: ToolContext
): Promise<string> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.channelId, ctx.channelId), eq(tasks.number, args.number)))
    .limit(1);

  if (!task) {
    return JSON.stringify({ ok: false, error: `Tarea #${args.number} no encontrada` });
  }

  const validStatuses = ["todo", "in_progress", "in_review", "done", "closed"];
  if (!validStatuses.includes(args.status)) {
    return JSON.stringify({
      ok: false,
      error: `Estado inválido. Válidos: ${validStatuses.join(", ")}`,
    });
  }

  const updateData: Record<string, unknown> = {
    status: args.status,
    updatedAt: new Date(),
  };

  // If claiming (in_progress) and no owner → agent claims it
  if (args.status === "in_progress" && !task.ownerId && !task.agentId) {
    updateData.agentId = ctx.agentId;
  }

  await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, task.id));

  return JSON.stringify({
    ok: true,
    task_number: args.number,
    new_status: args.status,
    message: `Tarea #${args.number} → ${args.status}`,
  });
}

async function createChannel(
  args: { name: string; description?: string },
  ctx: ToolContext
): Promise<string> {
  const id = randomUUID();
  const name = args.name.toLowerCase().replace(/\s+/g, "-");

  const [channel] = await db
    .insert(channels)
    .values({
      id,
      workspaceId: ctx.workspaceId,
      name,
      description: args.description ?? null,
      isPrivate: false,
      createdBy: ctx.userId,
    })
    .returning();

  return JSON.stringify({
    ok: true,
    channel_id: id,
    channel_name: name,
    message: `Canal #${name} creado`,
  });
}

async function searchWeb(
  args: { query: string },
  _ctx: ToolContext
): Promise<string> {
  try {
    // Use DuckDuckGo HTML endpoint — no API key needed
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(args.query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return JSON.stringify({ ok: false, error: `Search failed: ${res.status}` });
    }

    const html = await res.text();

    // Parse results from DDG HTML
    const results: { title: string; url: string; snippet: string }[] = [];
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;
    let match;
    let count = 0;
    while ((match = resultRegex.exec(html)) !== null && count < 5) {
      const rawUrl = match[1];
      // DDG wraps URLs in a redirect
      const urlMatch = rawUrl.match(/uddg=([^&]+)/);
      const cleanUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : rawUrl;
      const title = match[2].replace(/<[^>]*>/g, "").trim();
      const snippet = match[3].replace(/<[^>]*>/g, "").trim();
      results.push({ title, url: cleanUrl, snippet });
      count++;
    }

    if (results.length === 0) {
      // Fallback: try simpler regex
      const links = html.match(/<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/g);
      if (links) {
        for (let i = 0; i < Math.min(links.length, 5); i++) {
          const text = links[i].replace(/<[^>]*>/g, "").trim();
          results.push({ title: text, url: "", snippet: "" });
        }
      }
    }

    return JSON.stringify({
      ok: true,
      query: args.query,
      results,
      count: results.length,
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: `Search error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

async function mentionAgent(
  args: { agent_name: string; message: string },
  ctx: ToolContext
): Promise<string> {
  // Find the agent by name in the workspace
  const [targetAgent] = await db
    .select()
    .from(agents)
    .where(eq(agents.name, args.agent_name))
    .limit(1);

  if (!targetAgent) {
    return JSON.stringify({
      ok: false,
      error: `Agente "@${args.agent_name}" no encontrado`,
    });
  }

  if (targetAgent.id === ctx.agentId) {
    return JSON.stringify({ ok: false, error: "No puedes mencionarte a ti mismo" });
  }

  // Insert a message from the current agent mentioning the target
  const msgId = randomUUID();
  await db.insert(messages).values({
    id: msgId,
    channelId: ctx.channelId,
    agentId: ctx.agentId,
    content: `@${args.agent_name} ${args.message}`,
  });

  // Trigger: the target agent will respond on next message poll
  // We mark this in the message for the POST handler to pick up
  return JSON.stringify({
    ok: true,
    mentioned_agent: args.agent_name,
    message: `Mención enviada a @${args.agent_name}`,
    note: "El agente mencionado responderá en breve",
  });
}

async function listAgents(
  _args: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  const workspaceAgents = await db
    .select({
      name: agents.name,
      description: agents.description,
      model: agents.model,
      status: agents.status,
    })
    .from(agents)
    .where(eq(agents.workspaceId, ctx.workspaceId))
    .orderBy(agents.name);

  return JSON.stringify({
    agents: workspaceAgents.map((a) => ({
      name: a.name,
      description: a.description ?? "",
      model: a.model,
      status: a.status,
    })),
    count: workspaceAgents.length,
  });
}

// ═════════════════════════════════════════════════════════════
// Export: tool definitions + executors map
// ═════════════════════════════════════════════════════════════

export const toolExecutors: Record<string, (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>> = {
  create_task: createTask as any,
  list_tasks: listTasks as any,
  update_task: updateTask as any,
  create_channel: createChannel as any,
  search_web: searchWeb as any,
  mention_agent: mentionAgent as any,
  list_agents: listAgents as any,
};

export { AGENT_TOOLS };
