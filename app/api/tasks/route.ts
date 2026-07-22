import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, channels, users, workspaceMembers } from "@/lib/db/schema";
import { eq, sql, inArray, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const workspaceChannels = await db
    .select()
    .from(channels)
    .where(eq(channels.workspaceId, member.workspaceId));

  const channelIds = workspaceChannels.map((c: any) => c.id);

  if (channelIds.length === 0) {
    return NextResponse.json([]);
  }

  const workspaceTasks = await db
    .select({
      id: tasks.id,
      channelId: tasks.channelId,
      number: tasks.number,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      ownerId: tasks.ownerId,
      agentId: tasks.agentId,
      createdById: tasks.createdById,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      ownerName: users.name,
      ownerAvatarSeed: users.avatarSeed,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.ownerId, users.id))
    .where(inArray(tasks.channelId, channelIds))
    .orderBy(desc(tasks.number));

  return NextResponse.json(workspaceTasks);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, description, channelId } = body;
  if (!title || !channelId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const [channel] = await db
    .select()
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  if (!channel) return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });

  const [{ maxNum }] = await db
    .select({ maxNum: sql<number>`MAX(${tasks.number})` })
    .from(tasks)
    .where(eq(tasks.channelId, channelId));

  const number = (maxNum ?? 0) + 1;

  const [task] = await db
    .insert(tasks)
    .values({
      id: randomUUID(),
      channelId,
      number,
      title,
      description,
      status: "todo",
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;

  const [task] = await db
    .update(tasks)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  return NextResponse.json(task);
}
