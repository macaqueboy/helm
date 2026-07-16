import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, workspaceMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const workspaceAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.workspaceId, member.workspaceId))
    .orderBy(agents.name);

  return NextResponse.json(workspaceAgents);
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
  const { name, description, runtime, model } = body;
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const [agent] = await db
    .insert(agents)
    .values({
      id: crypto.randomUUID(),
      workspaceId: member.workspaceId,
      name,
      description,
      runtime: runtime ?? "deepseek-v4-flash",
      model: model ?? "deepseek-v4-flash",
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(agent, { status: 201 });
}
