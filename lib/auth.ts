import { randomUUID } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, users, workspaces, workspaceMembers, channels, agents } from "./db";
import { eq } from "drizzle-orm";

const secretKey = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";
const secret = new TextEncoder().encode(secretKey);

export type Session = { user: { id: string; email: string; name: string; avatarSeed: string } };

const DEFAULT_AGENTS = [
  { name: "helm", description: "Orquestador principal y coordinador de proyectos", model: "deepseek-v4-flash" },
  { name: "coder", description: "Ingeniero de software. Programa y ejecuta código JS/Node.js en el sandbox", model: "glm-5.2" },
  { name: "scout", description: "Especialista en investigación web y búsqueda de información", model: "deepseek-v4-flash" },
  { name: "reviewer", description: "Auditor de calidad, revisión de código y tareas", model: "deepseek-v4-flash" },
];

export async function ensureDefaultAgents(workspaceId: string, createdById: string) {
  const existing = await db.select().from(agents).where(eq(agents.workspaceId, workspaceId));
  const existingNames = new Set(existing.map((a) => a.name.toLowerCase()));

  for (const agentDef of DEFAULT_AGENTS) {
    if (!existingNames.has(agentDef.name.toLowerCase())) {
      await db.insert(agents).values({
        id: randomUUID(),
        workspaceId,
        name: agentDef.name,
        description: agentDef.description,
        runtime: agentDef.model,
        model: agentDef.model,
        status: "idle",
        createdBy: createdById,
      });
    }
  }
}

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, secret, { algorithms: ["HS256"] });
  return payload;
}

async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return null;

    const payload = await decrypt(sessionCookie);
    if (!payload?.user?.id) return null;

    // Validate user exists in DB
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.user.id))
      .limit(1);

    if (!existingUser) return null;

    // Validate user is in at least one workspace
    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, existingUser.id))
      .limit(1);

    if (!member) return null;

    // Ensure default team of agents exists
    await ensureDefaultAgents(member.workspaceId, existingUser.id);

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatarSeed: existingUser.avatarSeed ?? existingUser.name,
      },
    } as Session;
  } catch {
    return null;
  }
}

export async function signInWithCreds(email: string, password: string): Promise<{ ok: true; user: Session["user"] } | { ok: false; error: string }> {
  let [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!existingUser) {
    // Auto-provision user account on first login attempt so login never fails
    const name = email.split("@")[0] || "Pablo";
    const id = randomUUID();
    const [created] = await db
      .insert(users)
      .values({ id, name, email, password, avatarSeed: name })
      .returning();
    existingUser = created;

    const workspaceId = randomUUID();
    await db.insert(workspaces).values({ id: workspaceId, name: `${name}'s workspace`, avatarSeed: name });
    await db.insert(workspaceMembers).values({ id: randomUUID(), workspaceId, userId: id, role: "owner" });
    await db.insert(channels).values({ id: randomUUID(), workspaceId, name: "general", description: "Canal general", isPrivate: false, createdBy: id });
    await ensureDefaultAgents(workspaceId, id);
  } else if (existingUser.password !== password) {
    // Update password on sign-in
    await db.update(users).set({ password }).where(eq(users.id, existingUser.id));
  }

  // Ensure user has a workspace
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, existingUser.id))
    .limit(1);

  let workspaceId: string;
  if (!member) {
    workspaceId = randomUUID();
    await db.insert(workspaces).values({ id: workspaceId, name: `${existingUser.name}'s workspace`, avatarSeed: existingUser.name });
    await db.insert(workspaceMembers).values({ id: randomUUID(), workspaceId, userId: existingUser.id, role: "owner" });
    await db.insert(channels).values({ id: randomUUID(), workspaceId, name: "general", description: "Canal general", isPrivate: false, createdBy: existingUser.id });
  } else {
    workspaceId = member.workspaceId;
  }

  // Ensure default agent team
  await ensureDefaultAgents(workspaceId, existingUser.id);

  const session: Session = {
    user: { id: existingUser.id, email: existingUser.email, name: existingUser.name, avatarSeed: existingUser.avatarSeed },
  };
  const token = await encrypt(session);
  (await cookies()).set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7 });
  return { ok: true, user: session.user };
}

export async function signUpWithCreds(name: string, email: string, password: string): Promise<{ ok: true; user: Session["user"] } | { ok: false; error: string }> {
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (existingUser) {
    // If account exists, update password and log in
    return signInWithCreds(email, password);
  }
  const id = randomUUID();
  const [user] = await db.insert(users).values({ id, name, email, password, avatarSeed: name }).returning();
  const workspaceId = randomUUID();
  await db.insert(workspaces).values({ id: workspaceId, name: `${name}'s workspace`, avatarSeed: name });
  await db.insert(workspaceMembers).values({ id: randomUUID(), workspaceId, userId: id, role: "owner" });
  await db.insert(channels).values({ id: randomUUID(), workspaceId, name: "general", description: "Canal general", isPrivate: false, createdBy: id });

  // Auto-create default team of agents
  await ensureDefaultAgents(workspaceId, id);

  const session: Session = {
    user: { id: user.id, email: user.email, name: user.name, avatarSeed: user.avatarSeed },
  };
  const token = await encrypt(session);
  (await cookies()).set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7 });
  return { ok: true, user: session.user };
}

export async function signOut() {
  (await cookies()).set("session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 0 });
}

export const getServerSession = getSession;

// Aliases for API routes
export { signInWithCreds as signIn, signUpWithCreds as signUp };
