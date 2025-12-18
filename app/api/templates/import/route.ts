import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CardTemplate } from '@/types/template';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { template, overwrite = false } = body;

        // Validate template structure
        if (!template.id || !template.name || !template.layers) {
            return NextResponse.json(
                { error: 'Invalid template structure. Required: id, name, layers' },
                { status: 400 }
            );
        }

        // Check if template exists
        const existing = await prisma.template.findUnique({
            where: { id: template.id }
        });

        if (existing && !overwrite) {
            return NextResponse.json(
                {
                    error: 'Template already exists',
                    templateId: template.id,
                    message: 'Set overwrite=true to replace existing template'
                },
                { status: 409 }
            );
        }

        // Extract metadata
        const category = template.category || 'General';
        const tags = template.tags || [];
        const filename = `${template.id}.json`;

        // Import template
        const imported = await prisma.template.upsert({
            where: { id: template.id },
            update: {
                filename,
                name: template.name,
                description: template.description,
                category,
                tags,
                data: template as any,
                metadata: {
                    width: template.width,
                    height: template.height,
                    colorRoles: template.colorRoles,
                    strictColorRoles: template.strictColorRoles,
                },
                version: existing ? existing.version + 1 : 1,
                updatedAt: new Date(),
            },
            create: {
                id: template.id,
                filename,
                name: template.name,
                description: template.description,
                category,
                tags,
                data: template as any,
                metadata: {
                    width: template.width,
                    height: template.height,
                    colorRoles: template.colorRoles,
                    strictColorRoles: template.strictColorRoles,
                },
                isPublic: true, // Make imported templates public by default
            },
        });

        return NextResponse.json({
            success: true,
            templateId: imported.id,
            action: existing ? 'updated' : 'created',
            version: imported.version,
        });
    } catch (error) {
        console.error('Template import failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to import template',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
