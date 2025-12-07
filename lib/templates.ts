// lib/templates.ts (MODIFIED - Enforcing standard dimensions + Logo Injection)

// CardTemplate now reflects the new enhanced structure from @/types/template
import { CardTemplate, TemplateExportMetadata } from "@/types/template";
// Assuming a new constants file defines the standard size:
import {
    STANDARD_CARD_WIDTH,
    STANDARD_CARD_HEIGHT,
    STANDARD_CARD_ORIENTATION
} from "./constants";
import { getLogoForTemplate } from "./logoAssignments";
import { generateRandomPalette } from "./colorGenerator";
import { applyPalette } from "./templateVariations";

// Import all template JSON files
import template01JSON from "../public/templates/template-01.json";
import template02JSON from "../public/templates/template-02.json";
import template03JSON from "../public/templates/template-03.json";
import template04JSON from "../public/templates/template-04.json";
import template05JSON from "../public/templates/template-05.json";
import template06JSON from "../public/templates/template-06.json";
import template07JSON from "../public/templates/template-07.json";
import template08JSON from "../public/templates/template-08.json";
import template09JSON from "../public/templates/template-09.json";
import template10JSON from "../public/templates/template-10.json";
import template11JSON from "../public/templates/template-11.json";
import template12JSON from "../public/templates/template-12.json";
import template13JSON from "../public/templates/template-13.json";
import template14JSON from "../public/templates/template-14.json";
import template15JSON from "../public/templates/template-15.json";
import template16JSON from "../public/templates/template-16.json";
import template17JSON from "../public/templates/template-17.json";
import template18JSON from "../public/templates/template-18.json";
import template19JSON from "../public/templates/template-19.json";
import template20JSON from "../public/templates/template-20.json";
import template21JSON from "../public/templates/template-21.json";

// Map for individual lookup - all templates must conform to the new CardTemplate type
// NOTE: We keep the raw JSON imported here.
const templateMap: Record<string, CardTemplate> = {
    template_01: template01JSON as CardTemplate,
    template_02: template02JSON as CardTemplate,
    template_03: template03JSON as CardTemplate,
    template_04: template04JSON as CardTemplate,
    template_05: template05JSON as CardTemplate,
    template_06: template06JSON as CardTemplate,
    template_07: template07JSON as CardTemplate,
    template_08: template08JSON as CardTemplate,
    template_09: template09JSON as CardTemplate,
    template_10: template10JSON as CardTemplate,
    template_11: template11JSON as CardTemplate,
    template_12: template12JSON as CardTemplate,
    template_13: template13JSON as CardTemplate,
    template_14: template14JSON as CardTemplate,
    template_15: template15JSON as CardTemplate,
    template_16: template16JSON as CardTemplate,
    template_17: template17JSON as CardTemplate,
    template_18: template18JSON as CardTemplate,
    template_19: template19JSON as CardTemplate,
    template_20: template20JSON as CardTemplate,
    template_21: template21JSON as CardTemplate,
};

/**
 * Helper function to enforce standard dimensions and orientation on a template.
 * This overrides the dimensions read from the JSON files.
 * Also injects the appropriate logo based on template ID and background color.
 */
const enforceStandardDimensions = (template: CardTemplate): CardTemplate => {
    // Get background color for smart logo selection
    const bgColor = template.background?.color1 || '#FFFFFF';

    // Get the appropriate logo variant for this template
    const logoVariant = getLogoForTemplate(template.id, bgColor);

    // Update logo layer if it exists
    const updatedLayers = template.layers.map(layer => {
        // Find logo layer by isLogo flag or by ID
        if ((layer.type === 'Image' && layer.props.isLogo) ||
            layer.id === 'main_logo' ||
            layer.id === 'logo_icon') {
            return {
                ...layer,
                type: 'Image' as const,
                props: {
                    ...layer.props,
                    src: logoVariant.path,
                    isLogo: true,
                    category: 'Image' as const
                }
            };
        }
        return layer;
    });

    return {
        ...template,
        width: STANDARD_CARD_WIDTH,
        height: STANDARD_CARD_HEIGHT,
        orientation: STANDARD_CARD_ORIENTATION,
        layers: updatedLayers
    };
};


/**
 * Function to get all templates as an array, enforcing standard dimensions.
 * Returns an array of the newly enhanced CardTemplate type.
 */
export function loadTemplates(): CardTemplate[] {
    // Use map to apply dimension enforcement to all loaded templates
    return Object.values(templateMap).map(enforceStandardDimensions);
}

/**
 * Function to get single template by id SYNCHRONOUSLY, enforcing standard dimensions.
 * Use this for editor initialization where async is not possible.
 * Note: This version does NOT regenerate QR codes - they keep original appearance.
 */
export function loadTemplate(id: string): CardTemplate {
    // Check if it's a direct match (base template)
    if (templateMap[id]) {
        return enforceStandardDimensions(templateMap[id]);
    }

    // For variations, apply palette synchronously (without QR regeneration)
    if (id.includes('_gen_')) {
        const parts = id.split('_gen_');
        const baseId = parts[0];
        const seedStr = parts[1];
        const baseTemplate = templateMap[baseId];

        if (baseTemplate && seedStr) {
            // Import synchronous palette application
            const { applyPaletteSync } = require("./paletteSync");
            const { generateRandomPalette } = require("./colorGenerator");

            // Generate the palette and apply it synchronously
            const palette = generateRandomPalette(seedStr);
            const variant = applyPaletteSync(baseTemplate, palette);
            return enforceStandardDimensions(variant);
        }
    }

    throw new Error(`Template with id "${id}" not found`);
}

/**
 * Function to get single template by id ASYNCHRONOUSLY, enforcing standard dimensions.
 * Use this for template browsing/variations where QR codes need to be regenerated.
 * Returns the enhanced CardTemplate type with regenerated QR codes.
 */
export async function loadTemplateAsync(id: string): Promise<CardTemplate> {
    // Check if it's a direct match (base template)
    if (templateMap[id]) {
        return enforceStandardDimensions(templateMap[id]);
    }

    // Check if it's a generated variation (format: baseId_gen_seed)
    // We check for the 'gen_' marker
    if (id.includes('_gen_')) {
        const parts = id.split('_gen_');
        // Reconstruct base ID (might contain underscores) and Seed
        const baseId = parts[0];
        const seedStr = parts[1]; // The part after gen_

        // Load base template
        const baseTemplate = templateMap[baseId];

        if (baseTemplate && seedStr) {
            // OPTIMIZATION: Use imported functions instead of runtime require
            // Re-generate the specific palette using the seed
            const palette = generateRandomPalette(seedStr);

            // Apply it (now async with QR regeneration)
            const variant = await applyPalette(baseTemplate, palette);
            return enforceStandardDimensions(variant);
        }
    }

    // Legacy fallback (shouldn't be hit with new logic but kept for safety)
    // If we have other variants logic.

    throw new Error(`Template with id "${id}" not found`);
}

// --- TEMPLATE EXPORT UTILITIES (NEW) ---
/**
 * Generate a unique template ID
 */
export function generateTemplateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `template_${timestamp}_${random}`;
}
/**
 * Extract colors from template layers
 */
function extractColorsFromLayers(layers: any[]): string[] {
    const colors = new Set<string>();

    layers.forEach(layer => {
        if (layer.props.fill) colors.add(layer.props.fill);
        if (layer.props.stroke) colors.add(layer.props.stroke);
    });

    return Array.from(colors).slice(0, 5); // Limit to 5 colors
}
/**
 * Prepare a template for export with metadata
 */
export function prepareTemplateForExport(
    currentPage: CardTemplate,
    metadata: TemplateExportMetadata
): CardTemplate {
    const templateId = generateTemplateId();
    const colors = metadata.colors || extractColorsFromLayers(currentPage.layers);

    return {
        id: templateId,
        name: metadata.name,
        width: currentPage.width,
        height: currentPage.height,
        orientation: currentPage.orientation,
        background: currentPage.background,
        layers: currentPage.layers,
        groups: currentPage.groups || [],
        thumbnail: "", // Empty for live rendering
        preview: "", // Empty for live rendering
        tags: metadata.tags,
        category: metadata.category,
        colors: colors,
        features: metadata.features
    };
}
/**
 * Validate template structure
 */
export function validateTemplate(template: CardTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.id) errors.push("Template ID is required");
    if (!template.name) errors.push("Template name is required");
    if (!template.width || template.width <= 0) errors.push("Valid width is required");
    if (!template.height || template.height <= 0) errors.push("Valid height is required");
    if (!template.orientation) errors.push("Orientation is required");
    if (!template.background) errors.push("Background is required");
    if (!Array.isArray(template.layers)) errors.push("Layers must be an array");
    if (!template.category) errors.push("Category is required");
    if (!Array.isArray(template.tags)) errors.push("Tags must be an array");

    if (Array.isArray(template.layers)) {
        template.layers.forEach((layer, index) => {
            if (!layer.id) errors.push(`Layer ${index} is missing an ID`);
            if (!layer.type) errors.push(`Layer ${index} is missing a type`);
            if (!layer.props) errors.push(`Layer ${index} is missing props`);
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}