import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'; // Ensure this is not cached

export async function GET(req: NextRequest) {
    try {
        const templatesDir = path.join(process.cwd(), 'public', 'templates');

        // Ensure directory exists
        if (!fs.existsSync(templatesDir)) {
            return NextResponse.json({ nextId: 'template-01' });
        }

        const files = fs.readdirSync(templatesDir);

        // Find all numbers used in template-XX.json files
        const usedNumbers = files
            .filter(file => file.startsWith('template-') && file.endsWith('.json'))
            .map(file => {
                const match = file.match(/^template-(\d+)\.json$/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => num > 0)
            .sort((a, b) => a - b);

        // Find the next available number
        let nextNumber = 1;
        if (usedNumbers.length > 0) {
            nextNumber = usedNumbers[usedNumbers.length - 1] + 1;
        }

        // Format as template-XX (pad with 0 if < 10)
        const paddedNumber = nextNumber.toString().padStart(2, '0');
        const nextId = `template-${paddedNumber}`;

        return NextResponse.json({ nextId });
    } catch (error) {
        console.error('Error determining next template ID:', error);
        return NextResponse.json(
            { error: 'Failed to determine next template ID' },
            { status: 500 }
        );
    }
}
