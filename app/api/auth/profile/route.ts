import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { name } = body;

  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  try {
    const [updatedUser] = await db
      .update(users)
      .set({ name: name.trim() })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}