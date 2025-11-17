// app/api/design/route.ts
import { NextRequest, NextResponse } from "next/server";

interface DesignStorage {
  [key: string]: any;
}

// In-memory demo storage (reset on server restart)
const designs: DesignStorage = {};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing design ID" }, { status: 400 });

  const design = designs[id];
  if (!design) return NextResponse.json({ error: "Design not found" }, { status: 404 });

  return NextResponse.json(design);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, data } = body;
    if (!id || !data) return NextResponse.json({ error: "Missing id or data" }, { status: 400 });

    designs[id] = data;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save design:", error);
    return NextResponse.json({ error: "Failed to save design" }, { status: 500 });
  }
}
