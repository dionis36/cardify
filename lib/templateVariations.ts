import { CardTemplate, KonvaNodeDefinition, BackgroundPattern, ColorPalette, ColorRoleMap, ColorRole } from "@/types/template";
import { generateRandomPalette } from "./colorGenerator";
import { analyzeTemplate, TemplateContextMap } from "./semanticAnalysis";
import { getContrastRatio } from "./smartTheme";
import { assignColorByRole, inferColorRoles, getLayerRole } from "./colorRoleAssignment";
import { regenerateQRCodeAsync, isQRCodeLayer } from "./qrcodeGenerator";

// NOTE: PALETTES constant removed in favor of procedural generation.
export const PALETTES: ColorPalette[] = [];

// --- HELPERS ---

/**
 * Applies a color palette to a template to create a new variation.
 */
export async function applyPalette(baseTemplate: CardTemplate, palette: ColorPalette): Promise<CardTemplate> {
    const variantId = `${baseTemplate.id}_${palette.id}`;

    // 1. Get color roles (explicit or inferred)
    const colorRoles = baseTemplate.colorRoles || inferColorRoles(baseTemplate);

    // 2. Analyze the Base Template Spatially
    const contextMap = analyzeTemplate(baseTemplate);

    // 3. Pre-calculate assigned colors for all layers using role-based assignment
    const layerColorMap = new Map<string, string>();

    baseTemplate.layers.forEach(layer => {
        if (['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'ComplexShape', 'Icon'].includes(layer.type)) {
            const context = contextMap[layer.id];
            let effectiveBg = palette.background;

            // Determine the actual background this layer sits on
            if (context && context.backgroundLayerId !== 'main_bg') {
                const bgId = context.backgroundLayerId;
                if (layerColorMap.has(bgId)) {
                    effectiveBg = layerColorMap.get(bgId)!;
                }
            }

            // Get the role for this layer
            const role = getLayerRole(layer, baseTemplate, colorRoles);

            let color = palette.primary;
            if (layer.props.fill === 'transparent' || !layer.props.fill) {
                color = 'transparent';
            } else if (role) {
                // Use role-based color assignment
                color = assignColorByRole(role, palette, effectiveBg);
            } else {
                // Fallback to contrast-based assignment
                if (getContrastRatio(effectiveBg, palette.primary) < 1.6) {
                    color = palette.secondary;
                }
            }

            layerColorMap.set(layer.id, color);
        }
    });

    // 4. Determine the correct logo for this variation
    // We use require to avoid circular dependencies (logoAssignments -> templateVariations -> logoAssignments)
    const { getLogoForTemplate } = require("./logoAssignments");
    const logoVariant = getLogoForTemplate(variantId, palette.background, palette.accent);

    // 5. Update layers (colors + logo + QR codes)
    const updatedLayers = await Promise.all(baseTemplate.layers.map(async (layer) => {
        const updatedLayer = await updateLayer(layer, palette, contextMap, layerColorMap, colorRoles);

        // Update logo layer if it exists
        if ((updatedLayer.type === 'Image' && updatedLayer.props.isLogo) ||
            updatedLayer.id === 'main_logo' ||
            updatedLayer.id === 'logo_icon') {

            return {
                ...updatedLayer,
                type: 'Image' as const,
                props: {
                    ...updatedLayer.props,
                    src: logoVariant.path,
                    isLogo: true,
                    category: 'Image' as const
                }
            };
        }
        return updatedLayer;
    }));

    return {
        ...baseTemplate,
        id: variantId,
        name: `${baseTemplate.name} (${palette.name})`,
        colors: [palette.background, palette.primary, palette.secondary],
        tone: palette.tone, // Pass the tone from the palette to the template
        background: updateBackground(baseTemplate.background, palette),
        layers: updatedLayers,
        colorRoles: colorRoles, // Preserve color roles in variation
    };
}

/**
 * Generates variations of a base template using procedural "Smart Logic".
 * Generates 16 total variants (1 Original + 15 Generated).
 */
export async function generateVariations(baseTemplate: CardTemplate): Promise<CardTemplate[]> {
    // Return the original template as the first item
    const variations: CardTemplate[] = [baseTemplate];
    const generatedIds = new Set<string>();

    // Generate 15 unique variations (Total 16 with base)
    let attempts = 0;
    while (variations.length < 16 && attempts < 30) {
        attempts++;

        // Deterministic seed: BaseID + Index + Attempt
        const seed = `${baseTemplate.id}_var_${variations.length}_${attempts}`;
        const palette = generateRandomPalette(seed);

        if (generatedIds.has(palette.id)) continue;
        generatedIds.add(palette.id);

        variations.push(await applyPalette(baseTemplate, palette));
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
        // Generate beautiful gradient colors based on palette
        let gradientColor1: string;
        let gradientColor2: string;

        if (palette.isDark) {
            // For dark themes: use darker primary and lighter accent for depth
            gradientColor1 = palette.primary;
            gradientColor2 = palette.background;
        } else {
            // For light themes: use vibrant primary and secondary
            gradientColor1 = palette.primary;
            gradientColor2 = palette.secondary;
        }

        // Update gradientStops if they exist, otherwise use color1/color2
        const updatedGradientStops = bg.gradientStops
            ? bg.gradientStops.map((stop, index) => {
                // Interpolate between our gradient colors based on stop position
                if (index === 0) {
                    return { ...stop, color: gradientColor1 };
                } else if (index === bg.gradientStops!.length - 1) {
                    return { ...stop, color: gradientColor2 };
                } else {
                    // For middle stops, create a blend using accent color for vibrancy
                    return { ...stop, color: palette.accent };
                }
            })
            : [
                { offset: 0, color: gradientColor1 },
                { offset: 1, color: gradientColor2 }
            ];

        return {
            ...bg,
            color1: gradientColor1,
            color2: gradientColor2,
            gradientStops: updatedGradientStops,
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


async function updateLayer(
    layer: KonvaNodeDefinition,
    palette: ColorPalette,
    contextMap: TemplateContextMap,
    layerColorMap: Map<string, string>,
    colorRoles: ColorRoleMap
): Promise<KonvaNodeDefinition> {
    const newLayer = JSON.parse(JSON.stringify(layer)); // Deep copy
    const context = contextMap[layer.id];

    // Determine the color of the background sitting immediately behind this layer
    let bgHex = palette.background; // Default to main card background

    if (context && context.backgroundLayerId !== 'main_bg') {
        // It's sitting on a shape. Get that shape's PRE-CALCULATED color.
        const shapeColor = layerColorMap.get(context.backgroundLayerId);
        if (shapeColor && shapeColor !== 'transparent') {
            bgHex = shapeColor;
        }
    }

    // Get the role for this layer
    const role = colorRoles[layer.id];

    if (newLayer.type === 'Text') {
        // Use role-based text color assignment if role is defined
        if (role && (role === 'primary-text' || role === 'secondary-text')) {
            newLayer.props.fill = assignColorByRole(role, palette, bgHex);
        } else {
            // Fallback to original text logic
            const fontSize = newLayer.props.fontSize || 16;
            const contrastWithWhite = getContrastRatio(bgHex, '#FFFFFF');
            const contrastWithBlack = getContrastRatio(bgHex, '#000000');
            const contrastWithPrimary = getContrastRatio(bgHex, palette.primary);

            if (fontSize > 18 && contrastWithPrimary > 3.5) {
                newLayer.props.fill = palette.primary;
            } else {
                if (contrastWithWhite > contrastWithBlack) {
                    newLayer.props.fill = contrastWithWhite > 4.5 ? '#FFFFFF' : '#F0F0F0';
                } else {
                    const contrastPaletteText = getContrastRatio(bgHex, palette.text);
                    newLayer.props.fill = contrastPaletteText > 4.5 ? palette.text : '#000000';
                }
            }
        }

        // Apply shadow color role if specified
        if (newLayer.props.shadowColor && (newLayer.props as any).shadowColorRole) {
            const { extractOpacity, applyOpacity } = require('./colorRoleAssignment');
            const shadowRole = (newLayer.props as any).shadowColorRole as ColorRole;
            const shadowColor = assignColorByRole(shadowRole, palette, bgHex);

            // Preserve opacity from original shadow
            const originalOpacity = extractOpacity(newLayer.props.shadowColor);
            newLayer.props.shadowColor = applyOpacity(shadowColor, originalOpacity);
        }

    } else if (['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'Icon', 'ComplexShape'].includes(newLayer.type)) {
        // Apply the pre-calculated color from the map (which now uses role-based assignment)
        const assignedColor = layerColorMap.get(layer.id);
        const strokeWidth = (newLayer.props as any).strokeWidth || 0;

        // Handle fill based on original design intent
        if (layer.props.fill === 'transparent') {
            // Case 1: Outline-only shape (original fill was transparent)
            newLayer.props.fill = 'transparent';
        } else if (assignedColor && newLayer.props.fill !== 'transparent') {
            // Case 2 & 3: Fill-only or filled-with-outline
            newLayer.props.fill = assignedColor;
        }

        // Handle stroke based on strokeWidth
        if (newLayer.props.stroke && newLayer.props.stroke !== 'transparent' && strokeWidth > 0) {
            // Apply color role to stroke for shapes with visible stroke
            if (role) {
                newLayer.props.stroke = assignColorByRole(role, palette, bgHex);
            } else {
                newLayer.props.stroke = palette.secondary;
            }
        }

        // Apply shadow color role if specified
        if (newLayer.props.shadowColor && (newLayer.props as any).shadowColorRole) {
            const { extractOpacity, applyOpacity } = require('./colorRoleAssignment');
            const shadowRole = (newLayer.props as any).shadowColorRole as ColorRole;
            const shadowColor = assignColorByRole(shadowRole, palette, bgHex);

            // Preserve opacity from original shadow
            const originalOpacity = extractOpacity(newLayer.props.shadowColor);
            newLayer.props.shadowColor = applyOpacity(shadowColor, originalOpacity);
        }

    } else if (newLayer.type === 'Arrow' || newLayer.type === 'Line') {
        // Linear elements usually Primary
        newLayer.props.stroke = palette.primary;
        newLayer.props.fill = palette.primary;
    } else if (isQRCodeLayer(newLayer)) {
        // Handle QR codes with color roles
        const qrMetadata = newLayer.props.qrMetadata;

        if (qrMetadata && role) {
            // Get the new foreground color based on the assigned role
            const newFgColor = assignColorByRole(role, palette, bgHex);

            // Regenerate the QR code with the new color
            const { metadata, base64Image } = await regenerateQRCodeAsync(qrMetadata, newFgColor);

            // Update both metadata and image
            newLayer.props.qrMetadata = metadata;
            if (base64Image) {
                newLayer.props.src = base64Image;
            }
        }
    }

    return newLayer;
}
