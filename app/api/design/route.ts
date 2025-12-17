// app/api/design/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API Route to retrieve a saved design by ID.
 * Usage: GET /api/design?id={designId}
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing design ID" }, { status: 400 });
    }

    const design = await prisma.design.findUnique({
      where: { id }
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json(design.data);
  } catch (error) {
    console.error("Failed to fetch design:", error);
    return NextResponse.json(
      { error: "Failed to fetch design" },
      { status: 500 }
    );
  }
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

    // Upsert: create if doesn't exist, update if exists
    const design = await prisma.design.upsert({
      where: { id },
      update: {
        data,
        updatedAt: new Date()
      },
      create: {
        id,
        data
      }
    });

    return NextResponse.json({ success: true, id: design.id });
  } catch (error) {
    console.error("Failed to save design:", error);
    return NextResponse.json({ error: "Failed to save design" }, { status: 500 });
  }
}

/**
 * API Route to delete a design.
 * Usage: DELETE /api/design?id={designId}
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing design ID" }, { status: 400 });
    }

    await prisma.design.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete design:", error);
    return NextResponse.json({ error: "Failed to delete design" }, { status: 500 });
  }
}
