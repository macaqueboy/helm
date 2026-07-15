import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json([{ id: "agt1", name: "Demo Agent", status: "active" }]);
}
export async function POST(req: Request) {
  return NextResponse.json({ id: "new", name: "Nuevo Agente", status: "idle" });
}
