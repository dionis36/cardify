// lib/colorRoleAssignment.ts
// Color role assignment logic for template variations

import { ColorRole, ColorRoleMap, ColorPalette, CardTemplate, KonvaNodeDefinition } from "@/types/template";
import { getContrastRatio } from "./smartTheme";

/**
 * Assigns a color to a layer based on its semantic role and the palette.
 * Ensures proper contrast and design intent preservation.
 */
export function assignColorByRole(
    role: ColorRole,
    palette: ColorPalette,
    backgroundHex: string
): string {
    switch (role) {
        case 'surface':
            // Surface elements should contrast with the main background
            // Use a color that's different from the background
            const surfaceContrast = getContrastRatio(palette.background, palette.primary);
            if (surfaceContrast > 2.0) {
                return palette.primary;
            } else {
                // If primary doesn't contrast well, use secondary
                return palette.secondary;
            }

        case 'accent':
            // Accent elements use the accent color for visual pop
            // This ensures decorative elements stand out
            return palette.accent;

        case 'decorative':
            // Decorative elements use secondary color
            return palette.secondary;

        case 'primary-text':
            // Primary text (headings, names) - high contrast required
            return getHighContrastTextColor(backgroundHex, palette);

        case 'secondary-text':
            // Secondary text (subtitles, info) - medium contrast
            return getMediumContrastTextColor(backgroundHex, palette);

        case 'highlight':
            // Highlight elements use primary color for emphasis
            return palette.primary;

        default:
            // Fallback to primary
            return palette.primary;
    }
}

/**
 * Gets a high-contrast text color for primary text elements.
 * Ensures WCAG AA compliance (4.5:1 ratio).
 */
function getHighContrastTextColor(backgroundHex: string, palette: ColorPalette): string {
    const contrastWithWhite = getContrastRatio(backgroundHex, '#FFFFFF');
    const contrastWithBlack = getContrastRatio(backgroundHex, '#000000');
    const contrastWithPrimary = getContrastRatio(backgroundHex, palette.primary);

    // For large text, primary color can be used if it has good contrast
    if (contrastWithPrimary > 4.5) {
        return palette.primary;
    }

    // Standard high contrast check
    if (contrastWithWhite > contrastWithBlack) {
        return contrastWithWhite > 4.5 ? '#FFFFFF' : '#F0F0F0';
    } else {
        const contrastPaletteText = getContrastRatio(backgroundHex, palette.text);
        return contrastPaletteText > 4.5 ? palette.text : '#000000';
    }
}

/**
 * Gets a medium-contrast text color for secondary text elements.
 * Slightly relaxed contrast for visual hierarchy.
 */
function getMediumContrastTextColor(backgroundHex: string, palette: ColorPalette): string {
    const contrastWithWhite = getContrastRatio(backgroundHex, '#FFFFFF');
    const contrastWithBlack = getContrastRatio(backgroundHex, '#000000');

    if (contrastWithWhite > contrastWithBlack) {
        // Use slightly dimmed white for secondary text
        return contrastWithWhite > 3.0 ? '#E0E0E0' : '#FFFFFF';
    } else {
        // Use palette text color or slightly lighter black
        const contrastPaletteText = getContrastRatio(backgroundHex, palette.text);
        return contrastPaletteText > 3.0 ? palette.text : '#333333';
    }
}

/**
 * Automatically infers color roles for templates without explicit definitions.
 * Uses heuristics based on layer type, size, and position.
 */
export function inferColorRoles(template: CardTemplate): ColorRoleMap {
    const roles: ColorRoleMap = {};

    // Separate layers by type
    const shapeLayers = template.layers.filter(layer =>
        ['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'ComplexShape'].includes(layer.type)
    );
    const textLayers = template.layers.filter(layer => layer.type === 'Text');

    // Sort shape layers by area (largest first)
    const sortedShapes = [...shapeLayers].sort((a, b) => {
        const areaA = (a.props.width || 0) * (a.props.height || 0);
        const areaB = (b.props.width || 0) * (b.props.height || 0);
        return areaB - areaA;
    });

    // Assign roles to shapes
    sortedShapes.forEach((layer, index) => {
        if (index === 0) {
            // Largest shape is likely a surface/background element
            roles[layer.id] = 'surface';
        } else if (layer.type === 'Path' || (layer.props as any).category === 'ComplexShape') {
            // Paths and complex shapes are usually decorative/accent
            roles[layer.id] = 'accent';
        } else {
            // Other shapes are decorative
            roles[layer.id] = 'decorative';
        }
    });

    // Assign roles to text layers based on font size
    textLayers.forEach(layer => {
        const fontSize = layer.props.fontSize || 16;
        if (fontSize > 40) {
            roles[layer.id] = 'primary-text';
        } else {
            roles[layer.id] = 'secondary-text';
        }
    });

    return roles;
}

/**
 * Validates that all layer IDs in colorRoles exist in the template.
 * Returns an array of invalid layer IDs.
 */
export function validateColorRoles(template: CardTemplate): string[] {
    if (!template.colorRoles) return [];

    const layerIds = new Set(template.layers.map(layer => layer.id));
    const invalidIds: string[] = [];

    for (const layerId in template.colorRoles) {
        if (!layerIds.has(layerId)) {
            invalidIds.push(layerId);
        }
    }

    return invalidIds;
}

/**
 * Gets the effective color role for a layer.
 * Uses explicit role if defined, otherwise infers it.
 */
export function getLayerRole(
    layer: KonvaNodeDefinition,
    template: CardTemplate,
    inferredRoles?: ColorRoleMap
): ColorRole | undefined {
    // Check explicit roles first
    if (template.colorRoles && template.colorRoles[layer.id]) {
        return template.colorRoles[layer.id];
    }

    // Fall back to inferred roles
    if (inferredRoles && inferredRoles[layer.id]) {
        return inferredRoles[layer.id];
    }

    return undefined;
}
