import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;
  const result = await signIn(email, password);
  if (result.ok) {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  return NextResponse.json({ error: result.error }, { status: 401 });
}
