import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { reactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");
  if (!messageId) return NextResponse.json({ error: "messageId requerido" }, { status: 400 });

  const list = await db
    .select()
    .from(reactions)
    .where(eq(reactions.messageId, messageId));

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { messageId, emoji } = body;
  if (!messageId || !emoji) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  // Toggle reaction: if user already reacted with this emoji, remove it; else add it
  const [existing] = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.messageId, messageId),
        eq(reactions.userId, session.user.id),
        eq(reactions.emoji, emoji)
      )
    );

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    return NextResponse.json({ action: "removed", id: existing.id });
  }

  const id = randomUUID();
  const [created] = await db
    .insert(reactions)
    .values({
      id,
      messageId,
      userId: session.user.id,
      emoji,
    })
    .returning();

  return NextResponse.json({ action: "added", reaction: created });
}
