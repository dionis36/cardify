import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { TemplateExportRequest, TemplateExportResponse } from '@/types/template';
import { validateTemplate } from '@/lib/templates';
export async function POST(req: NextRequest) {
    try {
        const body: TemplateExportRequest = await req.json();
        const { template, metadata, filename } = body;
        // Validate template structure
        const validation = validateTemplate(template);
        if (!validation.valid) {
            return NextResponse.json<TemplateExportResponse>(
                {
                    success: false,
                    error: `Template validation failed: ${validation.errors.join(', ')}`
                },
                { status: 400 }
            );
        }
        // Generate filename
        const sanitizedName = (filename || template.id)
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '_');
        const finalFilename = `${sanitizedName}.json`;
        // Construct file path
        const templatesDir = path.join(process.cwd(), 'public', 'templates');
        const filePath = path.join(templatesDir, finalFilename);
        // Check if file already exists
        if (fs.existsSync(filePath)) {
            return NextResponse.json<TemplateExportResponse>(
                {
                    success: false,
                    error: `Template file "${finalFilename}" already exists`
                },
                { status: 409 }
            );
        }
        // Write template to file
        fs.writeFileSync(
            filePath,
            JSON.stringify(template, null, 2),
            'utf-8'
        );
        return NextResponse.json<TemplateExportResponse>({
            success: true,
            filename: finalFilename,
            templateId: template.id
        });
    } catch (error) {
        console.error('Template export error:', error);
        return NextResponse.json<TemplateExportResponse>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}