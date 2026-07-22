import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, channels, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const [members] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  if (!members) redirect("/sign-in");

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, members.workspaceId));

  if (!workspace) redirect("/sign-in");

  const publicChannels = await db
    .select()
    .from(channels)
    .where(eq(channels.workspaceId, members.workspaceId));

  const workspaceAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.workspaceId, members.workspaceId));

  return (
    <AppShell
      workspace={workspace}
      channels={publicChannels}
      agents={workspaceAgents}
      user={session.user}
    >
      {children}
    </AppShell>
  );
}
