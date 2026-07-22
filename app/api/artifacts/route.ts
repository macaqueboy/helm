import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { artifacts, channels, workspaceMembers } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id))
    .limit(1);

  if (!member) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });

  let query = db
    .select()
    .from(artifacts)
    .where(
      channelId
        ? and(eq(artifacts.workspaceId, member.workspaceId), eq(artifacts.channelId, channelId))
        : eq(artifacts.workspaceId, member.workspaceId)
    )
    .orderBy(desc(artifacts.createdAt));

  const list = await query;
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, slug, content, channelId, agentId, messageId } = body;

  if (!title || !slug || !content) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id))
    .limit(1);

  if (!member) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });

  // Check highest version for slug
  const [existing] = await db
    .select()
    .from(artifacts)
    .where(and(eq(artifacts.workspaceId, member.workspaceId), eq(artifacts.slug, slug)))
    .orderBy(desc(artifacts.version))
    .limit(1);

  const nextVersion = existing ? existing.version + 1 : 1;

  const [created] = await db
    .insert(artifacts)
    .values({
      id: randomUUID(),
      workspaceId: member.workspaceId,
      channelId: channelId || null,
      slug,
      title,
      content,
      version: nextVersion,
      agentId: agentId || null,
      messageId: messageId || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
