import { ColorPalette } from "@/types/template";
import { getContrastRatio } from "./smartTheme"; // Use shared contrast logic

// --- HSL HELPER CLASS ---

class HSL {
    constructor(
        public h: number, // 0-360
        public s: number, // 0-100
        public l: number  // 0-100
    ) { }

    toHex(): string {
        const h = this.h;
        const s = this.s; // Keep as 0-100 for calculation
        const l = this.l; // Keep as 0-100 for calculation

        let c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
        let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        let m = (l / 100) - c / 2;
        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

        const toHexStr = (n: number) => {
            const hex = Math.round((n + m) * 255).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };

        return `#${toHexStr(r)}${toHexStr(g)}${toHexStr(b)}`;
    }

    // Returns a new HSL with modified values
    rotate(deg: number): HSL {
        return new HSL((this.h + deg + 360) % 360, this.s, this.l);
    }

    saturate(amount: number): HSL {
        return new HSL(this.h, Math.min(100, Math.max(0, this.s + amount)), this.l);
    }

    lighten(amount: number): HSL {
        return new HSL(this.h, this.s, Math.min(100, Math.max(0, this.l + amount)));
    }
}

// --- SEEDED PRNG ---

class SeededRandom {
    private seed: number;

    constructor(seedStr: string) {
        let h = 0xdeadbeef;
        for (let i = 0; i < seedStr.length; i++) {
            h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
        }
        this.seed = (h ^ h >>> 16) >>> 0;
    }

    // Returns 0-1
    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    // Helper for range
    range(min: number, max: number): number {
        return min + (this.next() * (max - min));
    }
}

// --- GENIUS LOGIC ---

type SchemeType = 'monochromatic' | 'analogous' | 'complementary' | 'triadic';

export function generateRandomPalette(seed?: string): ColorPalette {
    // 1. Initialization
    const id = seed || Math.random().toString(36).substring(7);
    const rng = new SeededRandom(id);
    const rand = () => rng.next();

    // 2. Select Scheme (Weighted for professionalism)
    const schemeCheck = rand();
    let scheme: SchemeType = 'monochromatic';
    if (schemeCheck > 0.75) scheme = 'complementary';     // 25% High Contrast
    else if (schemeCheck > 0.50) scheme = 'triadic';      // 25% Vibrant Balanced
    else if (schemeCheck > 0.20) scheme = 'analogous';    // 30% Harmonious
    else scheme = 'monochromatic';                        // 20% Sophisticated

    // 3. Anchor Points (Base HSL)
    const baseH = Math.floor(rand() * 360);
    // Base Saturation: Avoids extreme grays (muddy) or neons (eye-pain) for the base anchor, 
    // though we will vary this later.
    const baseS = rng.range(50, 95);
    // Base Lightness: Avoids pure black/white as base, we want distinct color
    const baseL = rng.range(30, 70);

    const baseColor = new HSL(baseH, baseS, baseL);

    // 4. Generate Palette Colors based on Scheme
    let primaryHSL: HSL;
    let secondaryHSL: HSL;
    let surfaceHSL: HSL;

    switch (scheme) {
        case 'monochromatic':
            // Same Hue, Rely on S/L separation
            primaryHSL = baseColor; // The anchor
            // Secondary is lighter/desaturated or darker/saturated version
            secondaryHSL = baseColor.lighten(isBright(baseColor) ? -30 : 30).saturate(-10);
            break;

        case 'analogous':
            // Hues close together (+/- 30deg)
            const angle = 30;
            primaryHSL = baseColor;
            secondaryHSL = baseColor.rotate(rand() > 0.5 ? angle : -angle);
            break;

        case 'complementary':
            // Opposite Hues
            primaryHSL = baseColor;
            secondaryHSL = baseColor.rotate(180);
            break;

        case 'triadic':
            // 120deg separation
            primaryHSL = baseColor;
            secondaryHSL = baseColor.rotate(rand() > 0.5 ? 120 : 240);
            break;

        default:
            primaryHSL = baseColor;
            secondaryHSL = baseColor.rotate(180);
    }

    // 5. Determine Background (Surface)
    // We want 40% Dark, 40% Bold/Vibrant, 20% Light
    const bgType = rand();
    let isDark = false;

    if (bgType > 0.6) {
        // DARK THEME (Surface is Dark)
        // Use primary hue but very dark and low saturation (Charcoal/Navy influence)
        surfaceHSL = new HSL(primaryHSL.h, rng.range(10, 30), rng.range(5, 15));
        isDark = true;
    } else if (bgType > 0.2) {
        // BOLD/VIBRANT THEME (Surface is the Primary Color itself!)
        // In this case, the Primary Role effectively becomes the background.
        // We ensure it's punchy.
        surfaceHSL = new HSL(primaryHSL.h, rng.range(70, 100), rng.range(35, 65));

        // Check if this random bold color is perceptually dark
        // Simple approx check for L
        isDark = surfaceHSL.l < 55; // Threshold where white text looks better
    } else {
        // LIGHT THEME (Surface is Off-White)
        surfaceHSL = new HSL(primaryHSL.h, rng.range(5, 20), rng.range(92, 98));
        isDark = false;
    }

    // 6. Refine Colors for Context
    // Now we have Raw Primary, Secondary, and Surface.
    // We must ensure Primary/Secondary are visible against Surface if used as elements.

    // If "Bold Theme" (Surface is vibrant), usually Primary == Surface. 
    // So "Primary" usages should probably map to White/Black or Secondary to stand out.
    // But for the data structure, we keep 'primary' as the Brand Color.

    // Let's finalize the Hex strings
    const background = surfaceHSL.toHex();
    const primHex = primaryHSL.toHex();
    const secHex = secondaryHSL.toHex();

    // 7. Calculate Best Text Color
    // STRICT WCAG check using our helper (assuming it uses luminance)
    // We compare White (#FFF) vs Black (#000) against the Background
    const whiteContrast = getContrastRatio(background, '#FFFFFF');
    const blackContrast = getContrastRatio(background, '#000000');
    // Also consider off-white/off-black for softness if contrast allows
    const softWhite = '#F8FAFC'; // Slate-50
    const softBlack = '#0F172A'; // Slate-900

    let textStr = softBlack;
    let subtextStr = '#64748B'; // Slate-500

    if (whiteContrast > blackContrast) {
        // Dark Background -> Light Text
        textStr = whiteContrast > 4.5 ? softWhite : '#FFFFFF';
        subtextStr = '#CBD5E1'; // Slate-300
    } else {
        // Light Background -> Dark Text
        textStr = blackContrast > 4.5 ? softBlack : '#000000';
    }

    // 8. Name Generation
    const themeName = isDark ? "Dark" : (surfaceHSL.l > 80 ? "Light" : "Bold");
    const schemeName = scheme.charAt(0).toUpperCase() + scheme.slice(1);
    const name = `${themeName} ${schemeName}`;

    return {
        id: `gen_${id}`,
        name,
        primary: primHex,
        secondary: secHex,
        background: background,
        text: textStr,
        subtext: subtextStr,
        isDark
    };
}

// Helper: Is this HSL color "bright"?
function isBright(color: HSL): boolean {
    return color.l > 60;
}
