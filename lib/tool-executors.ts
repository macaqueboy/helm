import { db, agents, tasks, channels, messages, agentMemory, reactions, reminders } from "@/lib/db";
import { toolLogs } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { runInNewContext } from "vm";
import type { ToolContext } from "@/lib/ai";
import { AGENT_TOOLS } from "@/lib/tools";

// ═════════════════════════════════════════════════════════════
// Tool Executors — each tool the LLM can call
// ═════════════════════════════════════════════════════════════

async function createTask(
  args: { title: string; description?: string },
  ctx: ToolContext
): Promise<string> {
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
  const query = db
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

  await db
    .insert(channels)
    .values({
      id,
      workspaceId: ctx.workspaceId,
      name,
      description: args.description ?? null,
      isPrivate: false,
      createdBy: ctx.userId,
    });

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

    const results: { title: string; url: string; snippet: string }[] = [];
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;
    let match;
    let count = 0;
    while ((match = resultRegex.exec(html)) !== null && count < 5) {
      const rawUrl = match[1];
      const urlMatch = rawUrl.match(/uddg=([^&]+)/);
      const cleanUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : rawUrl;
      const title = match[2].replace(/<[^>]*>/g, "").trim();
      const snippet = match[3].replace(/<[^>]*>/g, "").trim();
      results.push({ title, url: cleanUrl, snippet });
      count++;
    }

    if (results.length === 0) {
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

async function executeCode(
  args: { code: string },
  _ctx: ToolContext
): Promise<string> {
  try {
    const logs: string[] = [];
    const sandbox = {
      console: {
        log: (...a: any[]) => logs.push(a.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ")),
        error: (...a: any[]) => logs.push("[ERROR] " + a.map((x) => String(x)).join(" ")),
        warn: (...a: any[]) => logs.push("[WARN] " + a.map((x) => String(x)).join(" ")),
      },
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Buffer,
    };

    const evalResult = runInNewContext(args.code, sandbox, { timeout: 5000 });
    let output = logs.join("\n");

    if (evalResult !== undefined && evalResult !== null) {
      const resStr = typeof evalResult === "object" ? JSON.stringify(evalResult) : String(evalResult);
      output += (output ? "\n---> Retorno: " : "Retorno: ") + resStr;
    }

    return JSON.stringify({
      ok: true,
      output: output || "(Ejecutado con éxito en el sandbox sin salida)",
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: `Error en sandbox: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

async function mentionAgent(
  args: { agent_name: string; message: string },
  ctx: ToolContext
): Promise<string> {
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

  const msgId = randomUUID();
  await db.insert(messages).values({
    id: msgId,
    channelId: ctx.channelId,
    agentId: ctx.agentId,
    content: `@${args.agent_name} ${args.message}`,
  });

  return JSON.stringify({
    ok: true,
    mentioned_agent: args.agent_name,
    message: `Mención enviada a @${args.agent_name}`,
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

async function saveMemory(
  args: { content: string; category?: string; key?: string },
  ctx: ToolContext
): Promise<string> {
  if (!ctx.agentId) {
    return JSON.stringify({ ok: false, error: "Contexto de agente requerido para guardar memoria" });
  }

  const id = randomUUID();
  await db.insert(agentMemory).values({
    id,
    agentId: ctx.agentId,
    category: args.category ?? "general",
    key: args.key ?? null,
    content: args.content,
  });

  return JSON.stringify({
    ok: true,
    memory_id: id,
    message: "Memoria guardada correctamente",
  });
}

async function recallMemory(
  args: { category?: string },
  ctx: ToolContext
): Promise<string> {
  if (!ctx.agentId) {
    return JSON.stringify({ ok: false, error: "Contexto de agente requerido para recordar memorias" });
  }

  const items = await db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.agentId, ctx.agentId));

  const filtered = args.category
    ? items.filter((m: any) => m.category === args.category)
    : items;

  return JSON.stringify({
    ok: true,
    memories: filtered.map((m: any) => ({
      category: m.category,
      key: m.key,
      content: m.content,
      createdAt: m.createdAt,
    })),
    count: filtered.length,
  });
}

async function addReaction(
  args: { message_id: string; emoji: string },
  ctx: ToolContext
): Promise<string> {
  const id = randomUUID();
  await db.insert(reactions).values({
    id,
    messageId: args.message_id,
    agentId: ctx.agentId,
    emoji: args.emoji,
  });

  return JSON.stringify({
    ok: true,
    message: `Reacción ${args.emoji} añadida al mensaje`,
  });
}

async function setReminder(
  args: { title: string; minutes_from_now: number },
  ctx: ToolContext
): Promise<string> {
  if (!ctx.agentId) {
    return JSON.stringify({ ok: false, error: "Contexto de agente requerido" });
  }

  const id = randomUUID();
  const fireAt = new Date(Date.now() + (args.minutes_from_now || 5) * 60 * 1000);

  await db.insert(reminders).values({
    id,
    agentId: ctx.agentId,
    channelId: ctx.channelId,
    title: args.title,
    fireAt,
    status: "active",
  });

  return JSON.stringify({
    ok: true,
    reminder_id: id,
    fire_at: fireAt.toISOString(),
    message: `Recordatorio programado para dentro de ${args.minutes_from_now} min: "${args.title}"`,
  });
}

// ═════════════════════════════════════════════════════════════
// Export: tool definitions + executors map with logging
// ═════════════════════════════════════════════════════════════

async function logToolCall(ctx: ToolContext, toolName: string, args: any, result: string, status: string = "success") {
  try {
    const id = randomUUID();
    await db.insert(toolLogs).values({
      id,
      workspaceId: ctx.workspaceId,
      channelId: ctx.channelId || null,
      agentName: ctx.agentName || "unknown",
      toolName,
      input: JSON.stringify(args),
      output: result,
      status,
    });
  } catch (e) {
    console.error("Error logging tool call:", e);
  }
}

const rawExecutors: Record<string, (args: any, ctx: ToolContext) => Promise<string>> = {
  create_task: createTask as any,
  list_tasks: listTasks as any,
  update_task: updateTask as any,
  create_channel: createChannel as any,
  search_web: searchWeb as any,
  execute_code: executeCode as any,
  mention_agent: mentionAgent as any,
  list_agents: listAgents as any,
  save_memory: saveMemory as any,
  recall_memory: recallMemory as any,
  add_reaction: addReaction as any,
  set_reminder: setReminder as any,
};

export const toolExecutors: Record<string, (args: any, ctx: ToolContext) => Promise<string>> = {};

for (const [name, fn] of Object.entries(rawExecutors)) {
  toolExecutors[name] = async (args: any, ctx: ToolContext) => {
    try {
      const res = await fn(args, ctx);
      await logToolCall(ctx, name, args, res, "success");
      return res;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await logToolCall(ctx, name, args, errMsg, "failed");
      throw err;
    }
  };
}

export { AGENT_TOOLS };
