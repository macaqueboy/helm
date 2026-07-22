import { NextResponse } from "next/server";
import { signInWithCreds as signIn } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const result = await signIn(email, password);
    if (result.ok) {
      return NextResponse.json({ success: true, user: result.user });
    }
    return NextResponse.json({ error: result.error }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Error en servidor" }, { status: 500 });
  }
}
