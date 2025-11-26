import { CardTemplate, KonvaNodeDefinition, BackgroundPattern } from "@/types/template";

// --- DEFINITIONS ---

export interface ColorPalette {
    id: string;
    name: string;
    primary: string;   // Main brand color (e.g., for logos, accents)
    secondary: string; // Secondary brand color
    background: string; // Card background color
    text: string;      // Main text color
    subtext: string;   // Secondary text color
    isDark: boolean;   // Whether this is a dark theme
}

// --- PALETTES ---

export const PALETTES: ColorPalette[] = [
    {
        id: 'midnight-blue',
        name: 'Midnight Blue',
        primary: '#3B82F6', // Blue-500
        secondary: '#60A5FA', // Blue-400
        background: '#0F172A', // Slate-900
        text: '#F8FAFC', // Slate-50
        subtext: '#94A3B8', // Slate-400
        isDark: true,
    },
    {
        id: 'clean-white',
        name: 'Clean White',
        primary: '#2563EB', // Blue-600
        secondary: '#93C5FD', // Blue-300
        background: '#FFFFFF',
        text: '#1E293B', // Slate-800
        subtext: '#64748B', // Slate-500
        isDark: false,
    },
    {
        id: 'forest-green',
        name: 'Forest',
        primary: '#10B981', // Emerald-500
        secondary: '#34D399', // Emerald-400
        background: '#064E3B', // Emerald-900
        text: '#ECFDF5', // Emerald-50
        subtext: '#A7F3D0', // Emerald-200
        isDark: true,
    },
    {
        id: 'luxury-gold',
        name: 'Luxury',
        primary: '#D97706', // Amber-600
        secondary: '#F59E0B', // Amber-500
        background: '#18181B', // Zinc-900
        text: '#FEF3C7', // Amber-100
        subtext: '#D4D4D8', // Zinc-300
        isDark: true,
    },
    {
        id: 'sunset-orange',
        name: 'Sunset',
        primary: '#EA580C', // Orange-600
        secondary: '#F97316', // Orange-500
        background: '#FFF7ED', // Orange-50
        text: '#431407', // Orange-950
        subtext: '#9A3412', // Orange-800
        isDark: false,
    },
    {
        id: 'royal-purple',
        name: 'Royal',
        primary: '#7C3AED', // Violet-600
        secondary: '#A78BFA', // Violet-400
        background: '#2E1065', // Violet-950
        text: '#F5F3FF', // Violet-50
        subtext: '#DDD6FE', // Violet-200
        isDark: true,
    },
];

// --- GENERATOR LOGIC ---

/**
 * Generates variations of a base template using the defined palettes.
 */
export function generateVariations(baseTemplate: CardTemplate): CardTemplate[] {
    // Return the original template as the first item
    const variations: CardTemplate[] = [baseTemplate];

    // Generate a variation for each palette
    PALETTES.forEach(palette => {
        // Skip if the base template already looks like this palette (simple check)
        // For now, we just generate all to ensure variety.

        const variantId = `${baseTemplate.id}_${palette.id}`;

        const newTemplate: CardTemplate = {
            ...baseTemplate,
            id: variantId,
            name: `${baseTemplate.name} (${palette.name})`,
            colors: [palette.background, palette.primary, palette.secondary], // Update metadata
            background: updateBackground(baseTemplate.background, palette),
            layers: baseTemplate.layers.map(layer => updateLayer(layer, palette)),
        };

        variations.push(newTemplate);
    });

    return variations;
}

function updateBackground(bg: BackgroundPattern | undefined, palette: ColorPalette): BackgroundPattern {
    // Handle missing background (legacy templates)
    if (!bg) {
        return {
            type: 'solid',
            color1: palette.background
        };
    }

    // If it's a solid background, swap the color
    if (bg.type === 'solid') {
        return { ...bg, color1: palette.background };
    }
    // If it's a pattern, swap the background color but keep pattern style
    if (bg.type === 'pattern') {
        return {
            ...bg,
            color1: palette.background,
            patternColor: palette.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' // Subtle pattern overlay
        };
    }
    // For gradients/textures, we might need more complex logic, but for now:
    return bg;
}

function updateLayer(layer: KonvaNodeDefinition, palette: ColorPalette): KonvaNodeDefinition {
    const newLayer = JSON.parse(JSON.stringify(layer)); // Deep copy

    // Heuristic: Try to map existing colors to the new palette
    // This is tricky without semantic tagging in the JSON (e.g. "this is a primary color").
    // So we use a simpler approach: 
    // - Text -> palette.text or palette.subtext
    // - Shapes -> palette.primary or palette.secondary

    if (newLayer.type === 'Text') {
        // Determine if it's likely a title or subtitle based on font size
        const fontSize = newLayer.props.fontSize || 16;
        if (fontSize > 20) {
            newLayer.props.fill = palette.text;
        } else {
            newLayer.props.fill = palette.subtext;
        }
    } else if (['Rect', 'Circle', 'RegularPolygon', 'Star', 'Path', 'Icon'].includes(newLayer.type)) {
        // For shapes, we default to primary, but maybe alternate based on ID or something?
        // Let's just use primary for now to be safe.
        // Exception: If it's a very large shape (likely background accent), use secondary with low opacity?

        // Simple heuristic: 
        newLayer.props.fill = palette.primary;
        if (newLayer.props.stroke) {
            newLayer.props.stroke = palette.secondary;
        }
    } else if (newLayer.type === 'Arrow' || newLayer.type === 'Line') {
        newLayer.props.stroke = palette.primary;
        newLayer.props.fill = palette.primary;
    }

    return newLayer;
}
