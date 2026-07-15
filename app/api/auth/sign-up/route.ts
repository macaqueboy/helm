import { NextResponse } from "next/server";
import { signUp } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password } = body;
  const result = await signUp(name, email, password);
  if (result.ok) {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  return NextResponse.json({ error: result.error }, { status: 400 });
}
