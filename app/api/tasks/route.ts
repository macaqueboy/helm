import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json([]);
}
export async function POST(req: Request) {
  return NextResponse.json({ id: "task1", title: "Nueva tarea", status: "todo" });
}
