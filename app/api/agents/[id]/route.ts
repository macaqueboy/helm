import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db, agents, workspaceMembers } from "@/lib/db";
import { eq, and } from "drizzle-orm";

interface AgentParams {
  id: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<AgentParams> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [agent] = await db
    .select()
    .from(agents)
    .where(
      and(eq(agents.id, id), eq(agents.workspaceId, member.workspaceId))
    );

  if (!agent) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

  return NextResponse.json(agent);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<AgentParams> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, model, status } = body;

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verify agent exists in workspace
  const [existingAgent] = await db
    .select()
    .from(agents)
    .where(
      and(eq(agents.id, id), eq(agents.workspaceId, member.workspaceId))
    );

  if (!existingAgent) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (model) updateData.model = model;
  if (status) updateData.status = status;

  try {
    const [updatedAgent] = await db
      .update(agents)
      .set(updateData)
      .where(eq(agents.id, id))
      .returning();

    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json({ error: "Error al actualizar agente" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<AgentParams> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verify agent exists in workspace
  const [existingAgent] = await db
    .select()
    .from(agents)
    .where(
      and(eq(agents.id, id), eq(agents.workspaceId, member.workspaceId))
    );

  if (!existingAgent) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

  try {
    await db.delete(agents).where(eq(agents.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json({ error: "Error al eliminar agente" }, { status: 500 });
  }
}