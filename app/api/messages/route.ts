import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, users, agents, channels } from "@/lib/db/schema";
import { eq, asc, and, desc } from "drizzle-orm";
import { chatOpenCode } from "@/lib/ai";

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
      id: crypto.randomUUID(),
      channelId,
      userId: session.user.id,
      content,
    })
    .returning();

  // Check for @agentname mentions in the content
  const agentMentions = content.match(/@(\w+)/g)?.map((m: string) => m.slice(1)) || [];
  
  if (agentMentions.length > 0) {
    // Fetch the channel name for context
    const [channel] = await db.select({ name: channels.name }).from(channels).where(eq(channels.id, channelId));
    const channelName = channel?.name || "un canal";

    // Fetch recent messages (last 20) for context
    const recentMessages = await db
      .select({
        userName: users.name,
        agentName: agents.name,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(agents, eq(messages.agentId, agents.id))
      .where(eq(messages.channelId, channelId))
      .orderBy(desc(messages.createdAt))
      .limit(20);
    
    recentMessages.reverse(); // Oldest first for context

    // Process each mentioned agent
    for (const agentName of agentMentions) {
      // Match by name (case-insensitive). Agents default to "idle" status, not "active".
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.name, agentName));

      if (!agent) continue;

      try {
        // Build the context from recent messages
        const contextMessages = recentMessages.map((m: any) => {
          const sender = m.agentName ? `@${m.agentName} (agente)` : (m.userName || "Usuario");
          return `${sender}: ${m.content}`;
        });

        const systemPrompt = `Eres ${agent.name}. ${agent.description || ""}. Respond concisamente en español.`;
        
        const userMessages: Array<{ role: "system" | "user"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...contextMessages.map((m) => ({ role: "user" as const, content: m })),
        ];

        const { text: response } = await chatOpenCode(userMessages, { model: agent.model });

        // Insert the agent response
        await db.insert(messages).values({
          id: crypto.randomUUID(),
          channelId,
          agentId: agent.id,
          content: response,
        });
      } catch (error) {
        console.error(`Error calling agent ${agentName}:`, error);
        // Insert fallback message
        await db.insert(messages).values({
          id: crypto.randomUUID(),
          channelId,
          agentId: agent.id,
          content: "Agente no disponible temporalmente.",
        });
      }
    }
  }

  return NextResponse.json(userMsg, { status: 201 });
}