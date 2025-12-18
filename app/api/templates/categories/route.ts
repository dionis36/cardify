import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        // Get all unique categories with template counts
        const templates = await prisma.template.groupBy({
            by: ['category'],
            _count: {
                id: true,
            },
            where: {
                isPublic: true, // Only count public templates
            },
            orderBy: {
                category: 'asc',
            },
        });

        const categories = templates.map(t => ({
            name: t.category,
            count: t._count.id,
        }));

        // Add total count
        const total = await prisma.template.count({
            where: { isPublic: true }
        });

        return NextResponse.json({
            categories,
            total,
        });
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}
