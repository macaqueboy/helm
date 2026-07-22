import { randomUUID } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, users, workspaces, workspaceMembers, channels } from "./db";
import { eq } from "drizzle-orm";

const secretKey = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";
const secret = new TextEncoder().encode(secretKey);

export type Session = { user: { id: string; email: string; name: string; avatarSeed: string } };

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

    // Validate that user exists in DB
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.user.id))
      .limit(1);

    if (!existingUser) return null;

    // Validate that user is in at least one workspace
    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, existingUser.id))
      .limit(1);

    if (!member) return null;

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
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (!existingUser || existingUser.password !== password) {
    return { ok: false, error: "Credenciales inválidas" };
  }

  // Ensure user has a workspace
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, existingUser.id))
    .limit(1);

  if (!member) {
    const workspaceId = randomUUID();
    await db.insert(workspaces).values({ id: workspaceId, name: `${existingUser.name}'s workspace`, avatarSeed: existingUser.name });
    await db.insert(workspaceMembers).values({ id: randomUUID(), workspaceId, userId: existingUser.id, role: "owner" });
    await db.insert(channels).values({ id: randomUUID(), workspaceId, name: "general", description: "Canal general", isPrivate: false, createdBy: existingUser.id });
  }

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
    return { ok: false, error: "Email ya registrado" };
  }
  const id = randomUUID();
  const [user] = await db.insert(users).values({ id, name, email, password, avatarSeed: name }).returning();
  const workspaceId = randomUUID();
  await db.insert(workspaces).values({ id: workspaceId, name: `${name}'s workspace`, avatarSeed: name });
  await db.insert(workspaceMembers).values({ id: randomUUID(), workspaceId, userId: id, role: "owner" });
  // Auto-create "general" channel
  const channelId = randomUUID();
  await db.insert(channels).values({ id: channelId, workspaceId, name: "general", description: "Canal general", isPrivate: false, createdBy: id });

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
