import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json([{ id: "general", name: "general", isPrivate: false }]);
}
export async function POST(req: Request) {
  return NextResponse.json({ id: "new", name: "nuevo", isPrivate: false });
}
