import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, users, agents, channels } from "@/lib/db/schema";
import { eq, asc, and, desc } from "drizzle-orm";
import { agentLoop, type ChatMessage, type ToolContext } from "@/lib/ai";
import { AGENT_TOOLS, toolExecutors } from "@/lib/tool-executors";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  if (!channelId) return NextResponse.json({ error: "channelId requerido" }, { status: 400 });

  const results = await db
    .select({
      id: messages.id,
      channelId: messages.channelId,
      agentId: messages.agentId,
      userId: messages.userId,
      content: messages.content,
      parentId: messages.parentId,
      createdAt: messages.createdAt,
      userName: users.name,
      userAvatarSeed: users.avatarSeed,
      agentName: agents.name,
      agentAvatarSeed: agents.avatarSeed,
    })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .leftJoin(agents, eq(messages.agentId, agents.id))
    .where(eq(messages.channelId, channelId))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { content, channelId } = body;
  if (!content || !channelId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  // Insert the user message first
  const [userMsg] = await db
    .insert(messages)
    .values({
      id: randomUUID(),
      channelId,
      userId: session.user.id,
      content,
    })
    .returning();

  // Get channel + workspace info
  const [channel] = await db
    .select({ id: channels.id, workspaceId: channels.workspaceId, name: channels.name })
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  if (!channel) return NextResponse.json(userMsg, { status: 201 });
  const channelName = channel.name;

  // Check for @agentname mentions in the content
  const agentMentions = content.match(/@(\w+)/g)?.map((m: string) => m.slice(1)) || [];

  // Track which agents we've already triggered (prevent loops)
  const triggeredAgents = new Set<string>();
  const agentQueue: { agent: typeof agents.$inferSelect; triggerMessage: string }[] = [];

  if (agentMentions.length > 0) {
    // Process each mentioned agent
    for (const agentName of agentMentions) {
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.name, agentName), eq(agents.workspaceId, channel.workspaceId)))
        .limit(1);

      if (agent && !triggeredAgents.has(agent.id)) {
        triggeredAgents.add(agent.id);
        agentQueue.push({ agent, triggerMessage: content });
      }
    }
  } else {
    // No explicit @mentions -> trigger default agent (named "helm" or first workspace agent)
    const workspaceAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.workspaceId, channel.workspaceId));

    if (workspaceAgents.length > 0) {
      const defaultAgent =
        workspaceAgents.find((a) => a.name.toLowerCase() === "helm") ?? workspaceAgents[0];

      if (defaultAgent && !triggeredAgents.has(defaultAgent.id)) {
        triggeredAgents.add(defaultAgent.id);
        agentQueue.push({ agent: defaultAgent, triggerMessage: content });
      }
    }
  }

  if (agentQueue.length > 0) {
    // Fetch recent messages (last 30) for context
    const recentMessages = await db
      .select({
        userName: users.name,
        agentName: agents.name,
        agentId: agents.id,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(agents, eq(messages.agentId, agents.id))
      .where(eq(messages.channelId, channelId))
      .orderBy(desc(messages.createdAt))
      .limit(30);

    recentMessages.reverse(); // Oldest first for context

    const contextMessages = recentMessages.map((m: any) => {
      const sender = m.agentName ? `@${m.agentName} (agente)` : (m.userName || "Usuario");
      return `${sender}: ${m.content}`;
    });

    const MAX_CHAIN_DEPTH = 5; // Prevent infinite agent loops
    let chainDepth = 0;

    while (agentQueue.length > 0 && chainDepth < MAX_CHAIN_DEPTH) {
      const { agent, triggerMessage } = agentQueue.shift()!;

      // Update agent status to "busy"
      await db.update(agents).set({ status: "busy" }).where(eq(agents.id, agent.id));

      try {
        const toolContext: ToolContext = {
          channelId,
          agentId: agent.id,
          workspaceId: agent.workspaceId,
          userId: session.user.id,
          agentName: agent.name,
        };

        const systemPrompt = `Eres ${agent.name}, un agente AI en un workspace de colaboración.

Descripción: ${agent.description || "Agente generalista"}

Estás en el canal #${channelName}. Respondes en español, de forma concisa y directa.

Tienes herramientas disponibles. Úsalas cuando sea necesario:
- create_task: Crea una tarea cuando alguien pide hacer algo
- list_tasks: Lista tareas del canal
- update_task: Cambia el estado de una tarea (todo, in_progress, in_review, done, closed)
- create_channel: Crea un nuevo canal si un tema necesita su propio espacio
- search_web: Busca información en internet
- mention_agent: Menciona a otro agente para que colabore
- list_agents: Lista agentes disponibles
- save_memory / recall_memory: Almacena y recupera datos en memoria
- add_reaction: Añade reacciones emoji a mensajes
- set_reminder: Programa recordatorios

No digas que vas a hacer algo — hazlo con las tools y luego responde con el resultado.`;

        const chatMessages: ChatMessage[] = [
          { role: "system", content: systemPrompt },
          ...contextMessages.slice(-20).map((m: string): ChatMessage => ({
            role: "user",
            content: m,
          })),
          { role: "user", content: triggerMessage },
        ];

        // Run the agent loop with tools
        const result = await agentLoop(chatMessages, {
          model: agent.model,
          tools: AGENT_TOOLS,
          toolExecutors,
          toolContext,
          maxIterations: 10,
        });

        const responseContent = result.text || "Agente sin respuesta";
        await db.insert(messages).values({
          id: randomUUID(),
          channelId,
          agentId: agent.id,
          content: responseContent,
        });

        contextMessages.push(`@${agent.name} (agente): ${responseContent}`);

        // Check if agent mentioned other agents in its response
        const newMentions = responseContent.match(/@(\w+)/g)?.map((m: string) => m.slice(1)) || [];
        for (const mentionedName of newMentions) {
          const [mentionedAgent] = await db
            .select()
            .from(agents)
            .where(and(eq(agents.name, mentionedName), eq(agents.workspaceId, channel.workspaceId)))
            .limit(1);

          if (mentionedAgent && !triggeredAgents.has(mentionedAgent.id)) {
            triggeredAgents.add(mentionedAgent.id);
            agentQueue.push({ agent: mentionedAgent, triggerMessage: responseContent });
          }
        }
      } catch (error) {
        console.error(`Error calling agent ${agent.name}:`, error);
        await db.insert(messages).values({
          id: randomUUID(),
          channelId,
          agentId: agent.id,
          content: "Agente no disponible temporalmente.",
        });
      }

      // Reset agent status to "idle"
      await db.update(agents).set({ status: "idle" }).where(eq(agents.id, agent.id));
      chainDepth++;
    }
  }

  return NextResponse.json(userMsg, { status: 201 });
}
