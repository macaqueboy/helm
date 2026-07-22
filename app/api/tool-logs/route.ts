import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { toolLogs, workspaceMembers } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

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

  const list = await db
    .select()
    .from(toolLogs)
    .where(
      channelId
        ? and(eq(toolLogs.workspaceId, member.workspaceId), eq(toolLogs.channelId, channelId))
        : eq(toolLogs.workspaceId, member.workspaceId)
    )
    .orderBy(desc(toolLogs.createdAt))
    .limit(50);

  return NextResponse.json(list);
}
