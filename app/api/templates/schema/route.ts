import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'public', 'templates', 'schema.json');

// GET schema
export async function GET() {
    try {
        const schemaContent = await fs.readFile(SCHEMA_PATH, 'utf-8');
        const schema = JSON.parse(schemaContent);

        return NextResponse.json({
            schema,
            path: 'public/templates/schema.json',
        });
    } catch (error) {
        console.error('Failed to read schema:', error);
        return NextResponse.json(
            { error: 'Failed to read schema' },
            { status: 500 }
        );
    }
}

// PUT - Update schema
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { schema } = body;

        if (!schema) {
            return NextResponse.json(
                { error: 'Schema is required' },
                { status: 400 }
            );
        }

        // Validate it's valid JSON
        const schemaString = JSON.stringify(schema, null, 2);

        // Write to file
        await fs.writeFile(SCHEMA_PATH, schemaString, 'utf-8');

        return NextResponse.json({
            success: true,
            message: 'Schema updated successfully',
        });
    } catch (error) {
        console.error('Failed to update schema:', error);
        return NextResponse.json(
            { error: 'Failed to update schema' },
            { status: 500 }
        );
    }
}
