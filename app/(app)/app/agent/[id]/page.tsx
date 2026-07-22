import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentMemory, tasks, messages, channels } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { PixelAvatar } from "@/lib/pixel-avatar";
import AgentConsoleClient from "./agent-console-client";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const { id: agentId } = await params;

  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent) notFound();

  // Fetch agent memories
  const memories = await db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.agentId, agent.id))
    .orderBy(desc(agentMemory.createdAt));

  // Fetch tasks assigned or created by this agent
  const agentTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.agentId, agent.id))
    .orderBy(desc(tasks.updatedAt));

  // Fetch general channel for workspace to send direct messages
  const [generalChannel] = await db
    .select()
    .from(channels)
    .where(and(eq(channels.workspaceId, agent.workspaceId), eq(channels.name, "general")))
    .limit(1);

  // Fetch recent messages by this agent across workspace
  const recentAgentMessages = await db
    .select({
      id: messages.id,
      content: messages.content,
      channelId: messages.channelId,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.agentId, agent.id))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  return (
    <div className="h-full flex flex-col bg-brutal-cream overflow-y-auto p-6 space-y-6">
      {/* Agent Header Card */}
      <div className="border-2 border-brutal-black bg-white p-6 shadow-brutal-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PixelAvatar seed={agent.avatarSeed ?? agent.name} name={agent.name} size={64} rounded />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl uppercase tracking-wider text-brutal-black">
                @{agent.name}
              </h1>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono border-2 border-brutal-black uppercase font-bold ${
                  agent.status === "busy"
                    ? "bg-brutal-yellow text-black"
                    : agent.status === "stuck"
                    ? "bg-brutal-red text-white"
                    : "bg-brutal-lime text-black"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <p className="font-body text-sm text-brutal-stone mt-1">
              {agent.description || "Agente especializado del workspace"}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-mono text-brutal-black">
              <span>Modelo: <strong>{agent.model}</strong></span>
              <span>•</span>
              <span>Runtime: <strong>{agent.runtime || "OpenCode Go"}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing Agent Details & Live Direct Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Memories & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Memories Card */}
          <div className="border-2 border-brutal-black bg-white p-5 shadow-brutal-sm">
            <h2 className="font-display font-bold text-sm uppercase mb-3 flex items-center gap-2">
              <span>🧠</span> Memoria Persistente ({memories.length})
            </h2>
            {memories.length === 0 ? (
              <p className="font-mono text-xs text-brutal-stone italic">
                Sin registros en memoria aún. El agente guardará notas con save_memory.
              </p>
            ) : (
              <div className="space-y-2">
                {memories.map((m) => (
                  <div key={m.id} className="border-2 border-brutal-black bg-brutal-cream p-3 text-xs font-mono">
                    <div className="flex justify-between items-center mb-1 text-[10px] text-brutal-stone uppercase font-bold">
                      <span>Categoría: {m.category}</span>
                      <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}</span>
                    </div>
                    <p className="text-brutal-black font-body text-sm">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Responses by Agent */}
          <div className="border-2 border-brutal-black bg-white p-5 shadow-brutal-sm">
            <h2 className="font-display font-bold text-sm uppercase mb-3 flex items-center gap-2">
              <span>💬</span> Respuestas Recientes ({recentAgentMessages.length})
            </h2>
            {recentAgentMessages.length === 0 ? (
              <p className="font-mono text-xs text-brutal-stone italic">
                El agente no ha participado en conversaciones todavía.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {recentAgentMessages.map((msg) => (
                  <div key={msg.id} className="border-2 border-brutal-black bg-white p-3">
                    <div className="text-[10px] font-mono text-brutal-stone mb-1 flex justify-between">
                      <span>Canal ID: {msg.channelId}</span>
                      <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}</span>
                    </div>
                    <div className="font-body text-sm whitespace-pre-wrap text-brutal-black">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Direct Console */}
        <div className="space-y-6">
          <div className="border-2 border-brutal-black bg-white p-5 shadow-brutal-sm">
            <h2 className="font-display font-bold text-sm uppercase mb-3 flex items-center gap-2">
              <span>⚡</span> Consola Directa con @{agent.name}
            </h2>
            <p className="font-body text-xs text-brutal-stone mb-4">
              Envía una orden directa a @{agent.name}. Se procesará en el canal de trabajo.
            </p>
            {generalChannel ? (
              <AgentConsoleClient
                agentName={agent.name}
                channelId={generalChannel.id}
              />
            ) : (
              <p className="font-mono text-xs text-brutal-red font-bold">
                Sin canal activo para interactuar.
              </p>
            )}
          </div>

          {/* Assigned Tasks */}
          <div className="border-2 border-brutal-black bg-white p-5 shadow-brutal-sm">
            <h2 className="font-display font-bold text-sm uppercase mb-3 flex items-center gap-2">
              <span>📋</span> Tareas Asignadas ({agentTasks.length})
            </h2>
            {agentTasks.length === 0 ? (
              <p className="font-mono text-xs text-brutal-stone italic">
                No hay tareas asignadas a este agente.
              </p>
            ) : (
              <div className="space-y-2">
                {agentTasks.map((t) => (
                  <div key={t.id} className="border-2 border-brutal-black p-2 bg-brutal-yellow/20 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs">#{t.number}</span>{" "}
                      <span className="font-body text-xs font-semibold">{t.title}</span>
                    </div>
                    <span className="text-[10px] font-mono border border-brutal-black px-1.5 py-0.5 bg-white font-bold uppercase">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
