/**
 * Utility functions for converting light colors to darker equivalents
 * while preserving color families for better visibility on light backgrounds.
 */

/**
 * Calculate relative luminance of a hex color (0-1 scale)
 * Based on WCAG 2.0 formula
 */
export function getLuminance(hexColor: string): number {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Apply gamma correction
    const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Check if a color is too light for a light background
 * Returns true if luminance > 0.65 (needs darkening)
 */
export function shouldAdjustColor(hexColor: string): boolean {
    return getLuminance(hexColor) > 0.65;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Adjust a light color to a darker equivalent while preserving color family
 * @param hexColor - Original hex color (e.g., "#FFD9A0")
 * @returns Adjusted hex color suitable for light backgrounds
 */
export function adjustColorForLightBackground(hexColor: string): string {
    // Return original if already dark enough
    if (!shouldAdjustColor(hexColor)) {
        return hexColor;
    }

    // Parse hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Convert to HSL to preserve hue
    const [h, s, l] = rgbToHsl(r, g, b);

    // Darken by reducing lightness to 30-45% range
    // Higher saturation colors get slightly lighter target (more vibrant)
    const targetLightness = s > 50 ? 40 : 35;

    // Convert back to RGB
    const [newR, newG, newB] = hslToRgb(h, s, targetLightness);

    return rgbToHex(newR, newG, newB);
}

/**
 * Batch process colors in an SVG string
 * @param svgString - Original SVG string
 * @returns SVG string with adjusted colors
 */
export function adjustSvgColors(svgString: string): {
    adjustedSvg: string;
    colorMap: Record<string, string>;
} {
    const colorMap: Record<string, string> = {};

    // Match all hex colors in fill and stroke attributes
    const colorRegex = /(fill|stroke)="(#[0-9a-fA-F]{6})"/g;

    const adjustedSvg = svgString.replace(colorRegex, (match, attr, color) => {
        if (!colorMap[color]) {
            colorMap[color] = adjustColorForLightBackground(color);
        }
        return `${attr}="${colorMap[color]}"`;
    });

    return { adjustedSvg, colorMap };
}
