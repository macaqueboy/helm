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

const AGENT_PROMPTS: Record<string, string> = {
  helm: `Eres @helm, el orquestador y líder técnico del equipo de agentes en Helm.
Tu rol: Coordinar la conversación, dar respuestas claras y dirigir el trabajo del equipo.
Muestra proactividad:
- Si el usuario pide programar, hacer cálculos, ejecutar scripts o probar código -> Menciona a @coder para que ejecute el código en el sandbox.
- Si el usuario pide investigar, buscar datos en internet o documentarse -> Menciona a @scout para que busque en la web.
- Si hay trabajo listo para revisar o una tarea por verificar -> Menciona a @reviewer.
Responde de forma concisa en español y utiliza las herramientas necesarias.`,

  coder: `Eres @coder, el ingeniero de software senior del equipo de Helm.
Tu rol: Programar, resolver algoritmos y EJECUTAR CÓDIGO en el sandbox usando la herramienta execute_code.
Si te piden escribir código, calcular algo o procesar datos:
1. Usa la herramienta execute_code con el código JS/Node.js para probarlo en el sandbox.
2. Muestra los resultados reales devueltos por el sandbox.
3. Si el trabajo está listo, mencionalo y pasa el testigo a @reviewer para validación.`,

  scout: `Eres @scout, el investigador técnico y analista de datos de Helm.
Tu rol: Realizar búsquedas web con search_web, reunir documentación, filtrar información y ofrecer síntesis precisas.
Usa la herramienta search_web cuando necesites datos actualizados. Reporta los hallazgos a @helm o @coder.`,

  reviewer: `Eres @reviewer, el auditor de calidad y seguridad de Helm.
Tu rol: Revisar las soluciones propuestas por @coder o @scout, validar el código y gestionar las tareas del canal con create_task o update_task.
Usa add_reaction para reaccionar a mensajes importantes con emojis (✅, 🚀, 💡).`,
};

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

  const triggeredAgents = new Set<string>();
  const agentQueue: { agent: typeof agents.$inferSelect; triggerMessage: string }[] = [];

  if (agentMentions.length > 0) {
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
    // Default trigger: @helm or first agent
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

    recentMessages.reverse();

    const contextMessages = recentMessages.map((m: any) => {
      const sender = m.agentName ? `@${m.agentName} (agente)` : (m.userName || "Usuario");
      return `${sender}: ${m.content}`;
    });

    const MAX_CHAIN_DEPTH = 6;
    let chainDepth = 0;

    while (agentQueue.length > 0 && chainDepth < MAX_CHAIN_DEPTH) {
      const { agent, triggerMessage } = agentQueue.shift()!;

      await db.update(agents).set({ status: "busy" }).where(eq(agents.id, agent.id));

      try {
        const toolContext: ToolContext = {
          channelId,
          agentId: agent.id,
          workspaceId: agent.workspaceId,
          userId: session.user.id,
          agentName: agent.name,
        };

        const customRolePrompt = AGENT_PROMPTS[agent.name.toLowerCase()] ||
          `Eres @${agent.name}, agente de IA especializado. ${agent.description || ""}`;

        const systemPrompt = `${customRolePrompt}

Estás colaborando en el canal #${channelName} con otros agentes del equipo (@helm, @coder, @scout, @reviewer).

Herramientas disponibles:
- execute_code: Ejecuta código JS/Node.js en un sandbox real y obtiene el stdout/resultado.
- search_web: Busca en internet con DuckDuckGo.
- create_task, list_tasks, update_task: Administra el tablero de tareas.
- create_channel, list_agents, mention_agent: Interactúa con el workspace.
- save_memory, recall_memory: Usa memoria persistente.
- add_reaction, set_reminder: Añade reacciones emoji y recordatorios.

Regla importante:
- Cuando ejecutes herramientas, hazlo directamente.
- Si colaboras con otro agente, menciónalo usando @nombre_agente en tu respuesta para invocarlo automáticamente.`;

        const chatMessages: ChatMessage[] = [
          { role: "system", content: systemPrompt },
          ...contextMessages.slice(-20).map((m: string): ChatMessage => ({
            role: "user",
            content: m,
          })),
          { role: "user", content: triggerMessage },
        ];

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

        // Scan for @agent mentions in response to trigger chain reaction
        const newMentions = responseContent.match(/@(\w+)/g)?.map((m: string) => m.slice(1)) || [];
        for (const mentionedName of newMentions) {
          const [mentionedAgent] = await db
            .select()
            .from(agents)
            .where(and(eq(agents.name, mentionedName), eq(agents.workspaceId, channel.workspaceId)))
            .limit(1);

          if (mentionedAgent && !triggeredAgents.has(mentionedAgent.id) && mentionedAgent.id !== agent.id) {
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
          content: "Agente ocupado o no disponible en este momento.",
        });
      }

      await db.update(agents).set({ status: "idle" }).where(eq(agents.id, agent.id));
      chainDepth++;
    }
  }

  return NextResponse.json(userMsg, { status: 201 });
}
