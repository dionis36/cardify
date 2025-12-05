import { CardTemplate, KonvaNodeDefinition, BackgroundPattern, ColorPalette } from "@/types/template";
import { generateRandomPalette } from "./colorGenerator";
import { analyzeTemplate, TemplateContextMap } from "./semanticAnalysis";
import { getContrastRatio } from "./smartTheme";

// NOTE: PALETTES constant removed in favor of procedural generation.
export const PALETTES: ColorPalette[] = [];

// --- HELPERS ---

/**
 * Applies a color palette to a template to create a new variation.
 */
export function applyPalette(baseTemplate: CardTemplate, palette: ColorPalette): CardTemplate {
    const variantId = `${baseTemplate.id}_${palette.id}`;

    // 1. Analyze the Base Template Spatially
    // (We could cache this, but it's fast enough for now)
    const contextMap = analyzeTemplate(baseTemplate);

    // 2. Pre-calculate assigned colors for Shapes so we can check contrast later
    // We need to know what color a Shape WILL be to decide the Text color on top of it.
    const shapeColorMap = new Map<string, string>();

    // First pass: Decide Shape Colors
    baseTemplate.layers.forEach(layer => {
        if (['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'ComplexShape'].includes(layer.type)) {
            // Logic to determine shape color (mirrors updateLayer logic)
            // Default to Primary
            let color = palette.primary;
            if (layer.props.fill === 'transparent' || !layer.props.fill) color = 'transparent';

            // Store it
            shapeColorMap.set(layer.id, color);
        }
    });

    return {
        ...baseTemplate,
        id: variantId,
        name: `${baseTemplate.name} (${palette.name})`,
        colors: [palette.background, palette.primary, palette.secondary],
        background: updateBackground(baseTemplate.background, palette),
        layers: baseTemplate.layers.map(layer => updateLayer(layer, palette, contextMap, shapeColorMap)),
    };
}

/**
 * Generates variations of a base template using procedural "Smart Logic".
 * Generates 10 total variants (1 Original + 9 Generated).
 */
export function generateVariations(baseTemplate: CardTemplate): CardTemplate[] {
    // Return the original template as the first item
    const variations: CardTemplate[] = [baseTemplate];
    const generatedIds = new Set<string>();

    // Generate 9 unique variations
    let attempts = 0;
    while (variations.length < 10 && attempts < 15) {
        attempts++;

        const palette = generateRandomPalette();

        if (generatedIds.has(palette.id)) continue;
        generatedIds.add(palette.id);

        variations.push(applyPalette(baseTemplate, palette));
    }

    return variations;
}

function updateBackground(bg: BackgroundPattern | undefined, palette: ColorPalette): BackgroundPattern {
    if (!bg) return { type: 'solid', color1: palette.background };

    if (bg.type === 'solid') {
        return { ...bg, color1: palette.background };
    }

    if (bg.type === 'pattern') {
        return {
            ...bg,
            color1: palette.background,
            patternColor: palette.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
        };
    }

    if (bg.type === 'gradient') {
        return {
            ...bg,
            color1: palette.background,
            color2: palette.isDark ? palette.primary : palette.secondary,
        };
    }

    if (bg.type === 'texture') {
        return {
            ...bg,
            overlayColor: palette.background,
            color1: palette.background
        };
    }

    return bg;
}


function updateLayer(
    layer: KonvaNodeDefinition,
    palette: ColorPalette,
    contextMap: TemplateContextMap,
    shapeColorMap: Map<string, string>
): KonvaNodeDefinition {
    const newLayer = JSON.parse(JSON.stringify(layer)); // Deep copy
    const context = contextMap[layer.id];

    // Determine the color of the background sitting immediately behind this layer
    let bgHex = palette.background; // Default to main card background

    if (context && context.backgroundLayerId !== 'main_bg') {
        // It's sitting on a shape. Get that shape's NEW assigned color.
        const shapeColor = shapeColorMap.get(context.backgroundLayerId);
        if (shapeColor && shapeColor !== 'transparent') {
            bgHex = shapeColor;
        }
    }

    if (newLayer.type === 'Text') {
        // Text Context-Aware Logic
        const fontSize = newLayer.props.fontSize || 16;

        // Check Contrast against the REAL background (bgHex)
        // If bgHex is Dark -> Text should be White
        // If bgHex is Light -> Text should be Black/Dark

        // Simple contrast check
        const contrastWithWhite = getContrastRatio(bgHex, '#FFFFFF');
        const contrastWithBlack = getContrastRatio(bgHex, '#000000');

        if (contrastWithWhite > contrastWithBlack) {
            // White text is better
            newLayer.props.fill = '#FFFFFF';
        } else {
            // Black text is better. Use Palette Text/Subtext for harmony if possible
            const paletteTextContrast = getContrastRatio(bgHex, palette.text);
            if (paletteTextContrast > 4.5) {
                newLayer.props.fill = palette.text;
            } else {
                newLayer.props.fill = '#000000'; // Fallback to pure black
            }
        }

    } else if (['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'Icon', 'ComplexShape'].includes(newLayer.type)) {
        // Apply pre-decided colors
        // Note: We might want to vary this? E.g. Shapes typically are Primary. 
        // But if a Shape is sitting on Primary, it should be Secondary.

        // Advanced: Check if THIS shape is sitting on another shape of the same color?
        // context.backgroundLayerId

        let targetColor = palette.primary;

        // If background is ALSO primary (e.g. gradient or large rect), swap to Secondary
        // (Approximation by checking hex equality)
        if (bgHex.toLowerCase() === palette.primary.toLowerCase()) {
            targetColor = palette.secondary;
        }

        if (newLayer.props.stroke) {
            newLayer.props.stroke = palette.secondary;
        }

        if (newLayer.props.fill && newLayer.props.fill !== 'transparent') {
            newLayer.props.fill = targetColor;
        }

    } else if (newLayer.type === 'Arrow' || newLayer.type === 'Line') {
        newLayer.props.stroke = palette.primary;
        newLayer.props.fill = palette.primary;
    }

    return newLayer;
}
