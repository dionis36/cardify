import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { CardTemplate } from '@/types/template';

const prisma = new PrismaClient();

async function importTemplates() {
    const templatesDir = path.join(process.cwd(), 'public', 'templates');
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json') && f !== 'schema.json');

    console.log(`\n📦 Found ${files.length} template files to import\n`);

    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const file of files) {
        try {
            const filePath = path.join(templatesDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const template: CardTemplate = JSON.parse(content);

            // Extract category from template or use default
            const category = template.category || 'General';
            const tags = template.tags || [];

            // Check if template exists
            const existing = await prisma.template.findUnique({
                where: { id: template.id }
            });

            const result = await prisma.template.upsert({
                where: { id: template.id },
                update: {
                    filename: file,
                    name: template.name || template.id,
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
                    updatedAt: new Date(),
                },
                create: {
                    id: template.id,
                    filename: file,
                    name: template.name || template.id,
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
                },
            });

            if (existing) {
                console.log(`✓ Updated: ${file} (${template.name})`);
                updated++;
            } else {
                console.log(`✓ Imported: ${file} (${template.name})`);
                imported++;
            }
        } catch (error) {
            console.error(`✗ Failed to import ${file}:`, error);
            failed++;
        }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✓ Imported: ${imported}`);
    console.log(`   ✓ Updated: ${updated}`);
    if (failed > 0) {
        console.log(`   ✗ Failed: ${failed}`);
    }
    console.log(`   📦 Total: ${files.length}\n`);

    await prisma.$disconnect();
}

importTemplates().catch((error) => {
    console.error('Import script failed:', error);
    process.exit(1);
});
