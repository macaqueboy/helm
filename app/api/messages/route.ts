import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

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
    })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
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

  const [msg] = await db
    .insert(messages)
    .values({
      id: crypto.randomUUID(),
      channelId,
      userId: session.user.id,
      content,
    })
    .returning();

  return NextResponse.json(msg, { status: 201 });
}
