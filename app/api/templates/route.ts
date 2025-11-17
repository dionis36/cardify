import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CardTemplate } from "@/types/template";

export async function GET(req: NextRequest) {
  try {
    const templatesDir = path.join(process.cwd(), "public", "templates");
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith(".json"));

    const templates: CardTemplate[] = files.map(file => {
      const filePath = path.join(templatesDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as CardTemplate;
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error loading templates:", error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}
