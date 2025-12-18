import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, templateIds, category } = body;

        // Validate input
        if (!action || !Array.isArray(templateIds) || templateIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request. Required: action, templateIds (array)' },
                { status: 400 }
            );
        }

        let result;

        switch (action) {
            case 'delete':
                result = await prisma.template.deleteMany({
                    where: { id: { in: templateIds } },
                });
                break;

            case 'feature':
                result = await prisma.template.updateMany({
                    where: { id: { in: templateIds } },
                    data: { isFeatured: true },
                });
                break;

            case 'unfeature':
                result = await prisma.template.updateMany({
                    where: { id: { in: templateIds } },
                    data: { isFeatured: false },
                });
                break;

            case 'publish':
                result = await prisma.template.updateMany({
                    where: { id: { in: templateIds } },
                    data: { isPublic: true },
                });
                break;

            case 'unpublish':
                result = await prisma.template.updateMany({
                    where: { id: { in: templateIds } },
                    data: { isPublic: false },
                });
                break;

            case 'categorize':
                if (!category) {
                    return NextResponse.json(
                        { error: 'Category is required for categorize action' },
                        { status: 400 }
                    );
                }
                result = await prisma.template.updateMany({
                    where: { id: { in: templateIds } },
                    data: { category },
                });
                break;

            default:
                return NextResponse.json(
                    { error: `Invalid action: ${action}. Valid actions: delete, feature, unfeature, publish, unpublish, categorize` },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            action,
            affected: result.count,
            templateIds,
        });
    } catch (error) {
        console.error('Bulk operation failed:', error);
        return NextResponse.json(
            {
                error: 'Bulk operation failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
