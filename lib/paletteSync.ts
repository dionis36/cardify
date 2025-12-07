// lib/paletteSync.ts
// Synchronous palette application for editor (without QR regeneration)

import { CardTemplate, KonvaNodeDefinition, BackgroundPattern, ColorPalette, ColorRoleMap } from "@/types/template";
import { analyzeTemplate, TemplateContextMap } from "./semanticAnalysis";
import { getContrastRatio } from "./smartTheme";
import { assignColorByRole, inferColorRoles, getLayerRole } from "./colorRoleAssignment";

/**
 * Applies a color palette to a template SYNCHRONOUSLY (without QR regeneration).
 * Use this for editor initialization where async is not possible.
 */
export function applyPaletteSync(baseTemplate: CardTemplate, palette: ColorPalette): CardTemplate {
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
    const { getLogoForTemplate } = require("./logoAssignments");
    const logoVariant = getLogoForTemplate(variantId, palette.background, palette.accent);

    // 5. Update layers (colors + logo, NO QR regeneration)
    const updatedLayers = baseTemplate.layers.map(layer => {
        const updatedLayer = updateLayerSync(layer, palette, contextMap, layerColorMap, colorRoles);

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
    });

    return {
        ...baseTemplate,
        id: variantId,
        name: `${baseTemplate.name} (${palette.name})`,
        colors: [palette.background, palette.primary, palette.secondary],
        tone: palette.tone,
        background: updateBackgroundSync(baseTemplate.background, palette),
        layers: updatedLayers,
        colorRoles: colorRoles,
    };
}

function updateBackgroundSync(bg: BackgroundPattern | undefined, palette: ColorPalette): BackgroundPattern {
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
        let gradientColor1: string;
        let gradientColor2: string;

        if (palette.isDark) {
            gradientColor1 = palette.primary;
            gradientColor2 = palette.background;
        } else {
            gradientColor1 = palette.primary;
            gradientColor2 = palette.secondary;
        }

        const updatedGradientStops = bg.gradientStops
            ? bg.gradientStops.map((stop, index) => {
                if (index === 0) {
                    return { ...stop, color: gradientColor1 };
                } else if (index === bg.gradientStops!.length - 1) {
                    return { ...stop, color: gradientColor2 };
                } else {
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

function updateLayerSync(
    layer: KonvaNodeDefinition,
    palette: ColorPalette,
    contextMap: TemplateContextMap,
    layerColorMap: Map<string, string>,
    colorRoles: ColorRoleMap
): KonvaNodeDefinition {
    const newLayer = JSON.parse(JSON.stringify(layer));
    const context = contextMap[layer.id];

    let bgHex = palette.background;

    if (context && context.backgroundLayerId !== 'main_bg') {
        const shapeColor = layerColorMap.get(context.backgroundLayerId);
        if (shapeColor && shapeColor !== 'transparent') {
            bgHex = shapeColor;
        }
    }

    const role = colorRoles[layer.id];

    if (newLayer.type === 'Text') {
        if (role && (role === 'primary-text' || role === 'secondary-text')) {
            newLayer.props.fill = assignColorByRole(role, palette, bgHex);
        } else {
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
    } else if (['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'Icon', 'ComplexShape'].includes(newLayer.type)) {
        const assignedColor = layerColorMap.get(layer.id);

        if (assignedColor && newLayer.props.fill !== 'transparent') {
            newLayer.props.fill = assignedColor;
        }

        if (newLayer.props.stroke) {
            newLayer.props.stroke = palette.secondary;
        }
    } else if (newLayer.type === 'Arrow' || newLayer.type === 'Line') {
        newLayer.props.stroke = palette.primary;
        newLayer.props.fill = palette.primary;
    } else if (newLayer.type === 'Image' && newLayer.props.qrMetadata) {
        // For QR codes: Update metadata color but DON'T regenerate image
        // The image will keep its original appearance in the editor
        const qrMetadata = newLayer.props.qrMetadata;
        if (qrMetadata && role) {
            const newFgColor = assignColorByRole(role, palette, bgHex);
            newLayer.props.qrMetadata = {
                ...qrMetadata,
                fgColor: newFgColor
            };
            // Note: src (image) stays the same - will show original QR code
        }
    }

    return newLayer;
}
