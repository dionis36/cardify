import { ColorPalette } from "@/types/template";
import { getContrastRatio } from "./smartTheme";

// --- HSL HELPER CLASS ---

class HSL {
    constructor(
        public h: number, // 0-360
        public s: number, // 0-100
        public l: number  // 0-100
    ) { }

    toHex(): string {
        const h = this.h;
        const s = this.s;
        const l = this.l;

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

    rotate(deg: number): HSL {
        return new HSL((this.h + deg + 360) % 360, this.s, this.l);
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

    // Helper for choice
    choice<T>(arr: T[]): T {
        return arr[Math.floor(this.next() * arr.length)];
    }
}

// --- GENIUS LOGIC TYPES ---

type ToneCategory = 'Corporate' | 'Modern' | 'Creative';

interface ToneConstraints {
    hueRange: [number, number]; // Start, End degree
    saturationRange: [number, number]; // Min, Max %
    lightnessRange: [number, number]; // Min, Max %
}

// --- GENIUS LOGIC CONFIGURATION ---

const TONE_CONSTRAINTS: Record<ToneCategory, ToneConstraints> = {
    Corporate: {
        hueRange: [180, 270], // Blues, Cyans, Teals
        saturationRange: [30, 60],
        lightnessRange: [40, 60]
    },
    Modern: {
        hueRange: [240, 320], // Purples, Violets, Magentas
        saturationRange: [50, 80],
        lightnessRange: [30, 50]
    },
    Creative: {
        hueRange: [0, 60], // Reds, Oranges, Yellows (Warm)
        saturationRange: [60, 80],
        lightnessRange: [50, 75]
    }
};

// --- CORE GENERATOR ---

export function generateRandomPalette(seed?: string): ColorPalette {
    // 1. Initialization
    const id = seed || Math.random().toString(36).substring(7);
    const rng = new SeededRandom(id);

    // 2. Select Tone Category (The Anchor)
    // Weighted probabilities: Corporate (40%), Modern (40%), Creative (20%)
    const toneRoll = rng.next();
    let tone: ToneCategory = 'Corporate';
    if (toneRoll > 0.8) tone = 'Creative';
    else if (toneRoll > 0.4) tone = 'Modern';

    const constraints = TONE_CONSTRAINTS[tone];

    // 3. Generate Base Hue (H0) within Tone Constraints
    const baseH = rng.range(constraints.hueRange[0], constraints.hueRange[1]);

    // 4. Generate Accent Color (The Pop)
    // High Saturation, Mid Lightness
    const accentH = baseH; // Monochromatic base for harmony
    const accentS = rng.range(70, 95);
    const accentL = rng.range(45, 60);
    const accentHSL = new HSL(accentH, accentS, accentL);

    // 5. Determine Background Logic (Light vs Dark vs Bold)
    const bgRoll = rng.next();
    let isDark = false;
    let bgHSL: HSL;

    if (bgRoll > 0.70) {
        // LIGHT THEME (30%)
        // Very Low Saturation, High Lightness
        const bgH = baseH;
        const bgS = rng.range(5, 20);
        const bgL = rng.range(92, 98); // Off-White
        bgHSL = new HSL(bgH, bgS, bgL);
        isDark = false;
    } else if (bgRoll > 0.30) {
        // DARK THEME (40%)
        // Low Saturation, Very Low Lightness
        // Shift hue slightly for depth
        const bgH = (baseH + rng.range(-15, 15) + 360) % 360;
        const bgS = rng.range(10, 30);
        const bgL = rng.range(5, 15); // Almost Black
        bgHSL = new HSL(bgH, bgS, bgL);
        isDark = true;
    } else {
        // BOLD/VIBRANT THEME (30%)
        // The background IS the primary brand color!
        // High Saturation, Mid-Low Lightness usually looks best
        const bgH = baseH;
        const bgS = rng.range(60, 90);
        const bgL = rng.range(25, 45); // Deep, rich color
        bgHSL = new HSL(bgH, bgS, bgL);

        // Bold themes are effectively dark for text contrast purposes
        isDark = true;
    }

    // 6. Generate Primary/Secondary Colors
    // Primary is often close to Accent but can vary
    const primaryHSL = accentHSL; // For now, Primary = Accent brand color

    // Secondary is a variation (rotate or desaturate)
    const secondaryHSL = primaryHSL.rotate(180); // Complementary for high contrast elements

    // 7. Calculate Best Text Colors (WCAG Contrast)
    const bgHex = bgHSL.toHex();

    const whiteContrast = getContrastRatio(bgHex, '#FFFFFF');
    const blackContrast = getContrastRatio(bgHex, '#000000');

    const softWhite = '#F8FAFC'; // Slate-50
    const softBlack = '#0F172A'; // Slate-900

    let textStr = softBlack;
    let subtextStr = '#64748B'; // Slate-500

    if (whiteContrast > blackContrast) {
        textStr = whiteContrast > 4.5 ? softWhite : '#FFFFFF';
        subtextStr = '#94A3B8'; // Slate-400
    } else {
        textStr = blackContrast > 4.5 ? softBlack : '#000000';
    }

    // 8. Construct Palette
    return {
        id: `gen_${id}`,
        name: `${tone} ${isDark ? 'Dark' : 'Light'}`,
        primary: primaryHSL.toHex(),
        secondary: secondaryHSL.toHex(),
        accent: accentHSL.toHex(), // The new constrained accent
        background: bgHex,
        text: textStr,
        subtext: subtextStr,
        isDark
    };
}
