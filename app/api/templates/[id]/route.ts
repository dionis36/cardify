import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single template by ID
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const template = await prisma.template.findUnique({
            where: { id: params.id },
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error('Failed to fetch template:', error);
        return NextResponse.json(
            { error: 'Failed to fetch template' },
            { status: 500 }
        );
    }
}

// PUT - Update template
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { name, description, category, tags, data, isFeatured, isPublic } = body;

        // Check if template exists
        const existing = await prisma.template.findUnique({
            where: { id: params.id }
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Update template
        const updated = await prisma.template.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(category && { category }),
                ...(tags && { tags }),
                ...(data && {
                    data: data as any,
                    metadata: {
                        width: data.width,
                        height: data.height,
                        colorRoles: data.colorRoles,
                        strictColorRoles: data.strictColorRoles,
                    }
                }),
                ...(isFeatured !== undefined && { isFeatured }),
                ...(isPublic !== undefined && { isPublic }),
                version: existing.version + 1, // Increment version
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            template: updated,
        });
    } catch (error) {
        console.error('Failed to update template:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

// DELETE template
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if template exists
        const existing = await prisma.template.findUnique({
            where: { id: params.id }
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        await prisma.template.delete({
            where: { id: params.id },
        });

        return NextResponse.json({
            success: true,
            message: `Template ${params.id} deleted successfully`
        });
    } catch (error) {
        console.error('Failed to delete template:', error);
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
