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
    // We process layers in order (Back -> Front) so we know the color of the layer underneath.
    const shapeColorMap = new Map<string, string>();

    baseTemplate.layers.forEach(layer => {
        if (['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'ComplexShape'].includes(layer.type)) {
            // 1. Find what we are sitting on
            const context = contextMap[layer.id];
            let effectiveBg = palette.background;

            if (context && context.backgroundLayerId !== 'main_bg') {
                const bgId = context.backgroundLayerId;
                if (shapeColorMap.has(bgId)) {
                    effectiveBg = shapeColorMap.get(bgId)!;
                }
            }

            // 2. Determine THIS shape's color based on that background
            // Logic: Default to Primary. If background is Primary, swap to Secondary.
            let color = palette.primary;
            if (layer.props.fill === 'transparent' || !layer.props.fill) {
                color = 'transparent';
            } else {
                // Check visual similarity (using contrast ratio as a proxy for similarity)
                // If contrast is very low (< 1.5), they are likely the same or very similar color.
                if (getContrastRatio(effectiveBg, palette.primary) < 1.6) {
                    color = palette.secondary;
                }
            }

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
        // It's sitting on a shape. Get that shape's PRE-CALCULATED color.
        const shapeColor = shapeColorMap.get(context.backgroundLayerId);
        if (shapeColor && shapeColor !== 'transparent') {
            bgHex = shapeColor;
        }
    }

    if (newLayer.type === 'Text') {
        // Text Context-Aware Logic
        const fontSize = newLayer.props.fontSize || 16;

        // Check Contrast against the REAL background (bgHex)
        const contrastWithWhite = getContrastRatio(bgHex, '#FFFFFF');
        const contrastWithBlack = getContrastRatio(bgHex, '#000000');
        const contrastWithPrimary = getContrastRatio(bgHex, palette.primary);

        // Can we use Primary color for text? (For titles mostly)
        // Only if it's large text AND has good contrast (AA Large = 3.0, but we prefer 4.5)
        if (fontSize > 18 && contrastWithPrimary > 3.5) {
            newLayer.props.fill = palette.primary;
        } else {
            // Standard Legibility Check
            if (contrastWithWhite > contrastWithBlack) {
                // White text is better
                newLayer.props.fill = contrastWithWhite > 4.5 ? '#FFFFFF' : '#F0F0F0';
            } else {
                // Black text is better
                // Try Palette Text (Dark Grey) first for softness, else Pure Black
                const contrastPaletteText = getContrastRatio(bgHex, palette.text);
                newLayer.props.fill = contrastPaletteText > 4.5 ? palette.text : '#000000';
            }
        }

    } else if (['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'Icon', 'ComplexShape'].includes(newLayer.type)) {
        // Apply the pre-calculated color from the map
        const assignedColor = shapeColorMap.get(layer.id);

        if (assignedColor && newLayer.props.fill !== 'transparent') {
            newLayer.props.fill = assignedColor;
        }

        if (newLayer.props.stroke) {
            // If stroke is same as fill, it's invisible.
            // If fill is Primary, make stroke Secondary or Surface?
            // Simple: Always Secondary for now.
            newLayer.props.stroke = palette.secondary;
        }

    } else if (newLayer.type === 'Arrow' || newLayer.type === 'Line') {
        // Linear elements usually Primary
        newLayer.props.stroke = palette.primary;
        newLayer.props.fill = palette.primary;
    }

    return newLayer;
}
