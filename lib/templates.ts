// lib/templates.ts (MODIFIED - Enforcing standard dimensions + Logo Injection)

// CardTemplate now reflects the new enhanced structure from @/types/template
import { CardTemplate } from "@/types/template";
// Assuming a new constants file defines the standard size:
import {
    STANDARD_CARD_WIDTH,
    STANDARD_CARD_HEIGHT,
    STANDARD_CARD_ORIENTATION
} from "./constants";
import { getLogoForTemplate } from "./logoAssignments";

// Import all template JSON files
import template01JSON from "../public/templates/template-01.json";
import template02JSON from "../public/templates/template-02.json";
import template03JSON from "../public/templates/template-03.json";
import template04JSON from "../public/templates/template-04.json";
import template05JSON from "../public/templates/template-05.json";
import template06JSON from "../public/templates/template-06.json";
import template07JSON from "../public/templates/template-07.json";
import template08JSON from "../public/templates/template-08.json";

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
 * Function to get single template by id, enforcing standard dimensions.
 * Returns the enhanced CardTemplate type.
 */
export function loadTemplate(id: string): CardTemplate {
    // Check if it's a direct match (base template)
    if (templateMap[id]) {
        return enforceStandardDimensions(templateMap[id]);
    }

    // Check if it's a variation (format: baseId_paletteId)
    // We iterate through palettes to see if the ID ends with a palette ID
    // This is safer than splitting by underscore since IDs might contain underscores
    const { PALETTES, generateVariations } = require("./templateVariations"); // Lazy import to avoid circular dependency issues if any

    for (const palette of PALETTES) {
        if (id.endsWith(`_${palette.id}`)) {
            const baseId = id.slice(0, -(palette.id.length + 1)); // +1 for the underscore
            const baseTemplate = templateMap[baseId];

            if (baseTemplate) {
                // Generate variations for this base template
                // This is slightly inefficient as it generates all variations to find one, 
                // but robust given the current structure.
                // Optimization: We could export a specific 'applyPalette' function.
                const variations = generateVariations(baseTemplate);
                const match = variations.find((v: CardTemplate) => v.id === id);

                if (match) {
                    return enforceStandardDimensions(match);
                }
            }
        }
    }

    throw new Error(`Template with id "${id}" not found`);
}