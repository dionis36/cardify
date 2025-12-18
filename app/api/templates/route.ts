import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CardTemplate } from "@/types/template";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const templates = await prisma.template.findMany({
      where: {
        ...(category && { category }),
        ...(featured === 'true' && { isFeatured: true }),
        isPublic: true, // Only show public templates
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        tags: true,
        thumbnail: true,
        data: true,
        isFeatured: true,
        createdAt: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform data field to match CardTemplate structure
    const formattedTemplates = templates.map(t => t.data as unknown as CardTemplate);

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    console.error("Error loading templates:", error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}
