import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, channels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function AppPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  if (!member) redirect("/sign-in");

  const publicChannels = await db
    .select()
    .from(channels)
    .where(eq(channels.workspaceId, member.workspaceId));

  const fallback = publicChannels.find((c) => c.name === "general");
  const target = fallback ?? publicChannels[0] ?? null;

  if (!target) {
    // Si no hay canales, el usuario puede crearlos en la UI; aquí devolvemos un mensaje sencillo
    return (
      <div className="h-full flex items-center justify-center bg-brutal-cream p-4">
        <div className="border-2 border-brutal-black bg-white p-6 shadow-brutal-md max-w-md">
          <h1 className="font-display font-bold text-lg mb-2">Sin canales</h1>
          <p className="font-body text-sm text-brutal-black">
            No hay canales en este workspace. Usa el sidebar para crear el primero.
          </p>
        </div>
      </div>
    );
  }

  redirect(`/app/channel/${target.id}`);
}
