import { CardTemplate, KonvaNodeDefinition } from '@/types/template';
import { LogoFamily, LogoVariant } from './logoIndex';

// Map of logo color names to approximate hex values for theming
const COLOR_MAP: Record<string, string> = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Blue': '#2563EB',
    'Green': '#16A34A',
    'Red': '#DC2626',
    'Purple': '#9333EA',
    'Orange': '#EA580C',
    'Yellow': '#CA8A04',
    'Pink': '#DB2777',
    'Navy': '#1E3A8A',
    'Grey': '#4B5563',
    'Mint': '#34D399',
    'Gold': '#D97706',
    'Silver': '#9CA3AF',
    'Turquoise': '#14B8A6',
    'Beige': '#D6D3D1',
    'Mustard': '#B45309',
    'Salmon': '#FB7185',
    'Baby-Blue': '#60A5FA',
    'Blue-Green': '#0D9488',
    'Blue-Blue': '#1D4ED8',
    'Pinker': '#BE185D',
    'Tree': '#15803D',
    'Grey-Purple': '#6B7280',
    'Green-Blue': '#0F766E'
};

// Helper to get hex from color name
function getHexForColorName(name: string): string {
    return COLOR_MAP[name] || '#000000';
}

// Helper to calculate luminance
export function getLuminance(hex: string): number {
    const c = hex.substring(1);      // strip #
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >> 8) & 0xff;  // extract green
    const b = (rgb >> 0) & 0xff;  // extract blue

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
    return luma;
}

// Helper to calculate contrast ratio (1-21)
export function getContrastRatio(c1: string, c2: string): number {
    const l1 = (getLuminance(c1) / 255) + 0.05;
    const l2 = (getLuminance(c2) / 255) + 0.05;
    return Math.max(l1, l2) / Math.min(l1, l2);
}

// Distance between two hex colors (0-765ish)
function getColorDistance(hex1: string, hex2: string): number {
    const r1 = parseInt(hex1.substring(1, 3), 16);
    const g1 = parseInt(hex1.substring(3, 5), 16);
    const b1 = parseInt(hex1.substring(5, 7), 16);

    const r2 = parseInt(hex2.substring(1, 3), 16);
    const g2 = parseInt(hex2.substring(3, 5), 16);
    const b2 = parseInt(hex2.substring(5, 7), 16);

    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}

// 1. Get Best Logo Variant
export function getBestLogoVariant(backgroundColor: string, family: LogoFamily, accentColor?: string): LogoVariant {
    const bgLuma = getLuminance(backgroundColor);
    const isDarkBg = bgLuma < 128;

    // 1. Accent Color Matching (Priority)
    if (accentColor) {
        // Check if accent has good contrast with background
        const accentContrast = getContrastRatio(backgroundColor, accentColor);

        // If accent is visible enough (relaxed constraint for logos, 2.5 is readable for large shapes)
        if (accentContrast > 2.5) {
            // Find the logo variant closest to this accent color
            let bestMatch: LogoVariant | null = null;
            let minDistance = 100; // Threshold for similarity (approx)

            for (const variant of family.variants) {
                const variantHex = getHexForColorName(variant.color);
                const distance = getColorDistance(accentColor, variantHex);

                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = variant;
                }
            }

            if (bestMatch) {
                return bestMatch;
            }
        }
    }

    // 2. Fallback Logic (Contrast-based)
    if (isDarkBg) {
        const white = family.variants.find(v => v.color === 'White');
        if (white) return white;
        return family.variants.find(v => v.color !== 'Black') || family.variants[0];
    } else {
        const black = family.variants.find(v => v.color === 'Black');
        if (black) return black;
        return family.variants.find(v => v.color !== 'White') || family.variants[0];
    }
}

// 2. Generate Theme from Logo
export type Theme = {
    primary: string;
    secondary: string;
    accent: string;
};

export function generateThemeFromLogo(variant: LogoVariant): Theme {
    const baseColor = getHexForColorName(variant.color);

    // If base color is white or black, use a default professional blue/gold theme
    if (baseColor === '#FFFFFF' || baseColor === '#000000') {
        return {
            primary: '#2C4A6B',
            secondary: '#1E3A5F',
            accent: '#F5C842'
        };
    }

    // Otherwise, generate a monochromatic or complementary theme
    return {
        primary: baseColor,
        secondary: adjustBrightness(baseColor, -20), // Darker
        accent: adjustBrightness(baseColor, 40) // Lighter/Brighter
    };
}

// Helper to adjust brightness
function adjustBrightness(hex: string, percent: number): string {
    var num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = (num >> 8 & 0x00FF) + amt,
        G = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
}

// 3. Apply Theme to Template
export function applyThemeToTemplate(template: CardTemplate, theme: Theme): CardTemplate {
    const newLayers: KonvaNodeDefinition[] = template.layers.map((layer): KonvaNodeDefinition => {
        // Handle Text Layers
        if (layer.type === 'Text') {
            const newProps = { ...layer.props };
            if (newProps.fontSize && newProps.fontSize > 30) {
                newProps.fill = theme.primary;
            } else {
                newProps.fill = theme.secondary;
            }
            return { ...layer, props: newProps };
        }

        // Handle Rect Layers
        if (layer.type === 'Rect') {
            const newProps = { ...layer.props };
            if (newProps.fill !== '#FFFFFF' && newProps.fill !== '#ffffff') {
                newProps.fill = theme.accent;
            }
            return { ...layer, props: newProps };
        }

        // Handle Circle Layers
        if (layer.type === 'Circle') {
            const newProps = { ...layer.props };
            if (newProps.fill !== '#FFFFFF' && newProps.fill !== '#ffffff') {
                newProps.fill = theme.accent;
            }
            return { ...layer, props: newProps };
        }

        // Handle Icons
        if (layer.type === 'Icon') {
            const newProps = { ...layer.props };
            newProps.fill = theme.primary;
            return { ...layer, props: newProps };
        }

        return layer;
    });

    return {
        ...template,
        layers: newLayers,
        colors: [theme.primary, theme.secondary, theme.accent]
    };
}
