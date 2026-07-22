import { NextResponse } from "next/server";
import { signUpWithCreds as signUp } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const result = await signUp(name, email, password);
    if (result.ok) {
      return NextResponse.json({ success: true, user: result.user });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Error en servidor" }, { status: 500 });
  }
}
