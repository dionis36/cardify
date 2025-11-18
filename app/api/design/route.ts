// app/api/design/route.ts
import { NextRequest, NextResponse } from "next/server";

interface DesignStorage {
  [key: string]: any;
}

// In-memory demo storage (reset on server restart)
// NOTE: For a production application, this should be replaced with a database call.
const designs: DesignStorage = {};

/**
 * API Route to retrieve a saved design by ID.
 * Usage: GET /api/design?id={designId}
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ error: "Missing design ID" }, { status: 400 });
  }

  const design = designs[id];
  
  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  return NextResponse.json(design);
}

/**
 * API Route to save a design (overwrites existing design).
 * Request Body: { id: string, data: any }
 * Usage: POST /api/design
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, data } = body;
    
    if (!id || !data) {
      return NextResponse.json({ error: "Missing id or data" }, { status: 400 });
    }

    // Save data to the in-memory store
    designs[id] = data;
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to save design:", error);
    return NextResponse.json({ error: "Failed to save design" }, { status: 500 });
  }
}