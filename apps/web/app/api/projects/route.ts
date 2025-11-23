import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, route: "projects" });
}

export async function POST() {
  return NextResponse.json({ ok: true, route: "projects", action: "create" });
}
