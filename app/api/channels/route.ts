import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { channels, workspaceMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    .where(eq(channels.workspaceId, member.workspaceId))
    .orderBy(channels.name);

  return NextResponse.json(workspaceChannels);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, description, isPrivate } = body;
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const [channel] = await db
    .insert(channels)
    .values({
      id: crypto.randomUUID(),
      workspaceId: member.workspaceId,
      name,
      description,
      isPrivate: isPrivate ?? false,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(channel, { status: 201 });
}
