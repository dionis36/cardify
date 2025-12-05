import { CardTemplate, KonvaNodeDefinition } from "@/types/template";

export interface LayerContext {
    layerId: string;
    backgroundLayerId: string; // 'main_bg' or the ID of the shape immediately behind this layer
    zIndex: number;
}

export type TemplateContextMap = Record<string, LayerContext>;

/**
 * Analyzes the spatial relationship of layers in a template.
 * Determines which layer is "behind" another layer using bounding box intersection.
 */
export function analyzeTemplate(template: CardTemplate): TemplateContextMap {
    const contextMap: TemplateContextMap = {};
    const layers = template.layers;

    // Sort valid shape layers by index (z-index)
    // We only care about filled shapes that could act as a background
    const potentialBackgrounds = layers.filter((l, idx) => {
        if (!l.visible === false) return false; // Skip invisible
        // Only solid shapes
        if (['Rect', 'Circle', 'RegularPolygon', 'ComplexShape'].includes(l.type)) {
            // Must have a fill
            // @ts-ignore
            if (l.props.fill && l.props.fill !== 'transparent' && l.props.fill !== 'none') {
                return true;
            }
        }
        return false;
    }).map((l, idx) => ({ layer: l, globalIndex: layers.indexOf(l) }));

    // For every layer, find the highest z-index shape that contains its center point
    layers.forEach((layer, index) => {
        // Default to main background
        const context: LayerContext = {
            layerId: layer.id,
            backgroundLayerId: 'main_bg',
            zIndex: index
        };

        // Only analyze prominent items (Text, Icons, Logos)
        if (['Text', 'Icon', 'Image'].includes(layer.type)) {
            const center = getCenter(layer);

            // Iterate potential backgrounds in reverse (top to bottom)
            // But only check those with LOWER index than current layer
            for (let i = potentialBackgrounds.length - 1; i >= 0; i--) {
                const bg = potentialBackgrounds[i];
                if (bg.globalIndex < index) {
                    if (containsPoint(bg.layer, center)) {
                        context.backgroundLayerId = bg.layer.id;
                        break; // Found the top-most background
                    }
                }
            }
        }

        contextMap[layer.id] = context;
    });

    return contextMap;
}

// --- GEOMETRY HELPERS ---

function getCenter(layer: KonvaNodeDefinition): { x: number, y: number } {
    const props = layer.props;
    // Rotation complicates things, but we use simple bounding box center for now
    // Ideally we'd use Konva's transformer logic, but this is a pure math approximation
    return {
        x: props.x + (props.width / 2),
        y: props.y + (props.height / 2)
    };
}

function containsPoint(shape: KonvaNodeDefinition, point: { x: number, y: number }): boolean {
    const props = shape.props;
    // Simple AABB check
    // Does not account for rotation or complex paths
    // TODO: Improve for rotated Rects
    return (
        point.x >= props.x &&
        point.x <= props.x + props.width &&
        point.y >= props.y &&
        point.y <= props.y + props.height
    );
}
