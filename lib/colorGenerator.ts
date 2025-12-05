import { ColorPalette } from "@/types/template";

// --- SEEDED PRNG ---

class SeededRandom {
    private seed: number;

    constructor(seedStr: string) {
        // Simple hash to integer
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
}

// --- HELPERS ---

function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function getLuminance(hex: string): number {
    const c = hex.replace('#', '');
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function getContrast(c1: string, c2: string): number {
    const l1 = getLuminance(c1) + 0.05;
    const l2 = getLuminance(c2) + 0.05;
    return Math.max(l1, l2) / Math.min(l1, l2);
}

// --- HARMONY ---

type HarmonyStrategy = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'monochromatic';

function generateHarmony(baseHue: number, strategy: HarmonyStrategy): number[] {
    switch (strategy) {
        case 'complementary':
            return [baseHue, (baseHue + 180) % 360];
        case 'analogous':
            return [baseHue, (baseHue + 30) % 360, (baseHue - 30 + 360) % 360];
        case 'triadic':
            return [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
        case 'split-complementary':
            return [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360];
        case 'monochromatic':
            return [baseHue, baseHue, baseHue];
        default:
            return [baseHue, (baseHue + 180) % 360];
    }
}

// --- GENERATOR ---

export function generateRandomPalette(seed?: string): ColorPalette {
    // Generate ID if not provided as seed
    const id = seed || Math.random().toString(36).substring(7);
    const rng = new SeededRandom(id);

    // Helpers bound to RNG
    const rand = () => rng.next();
    const randomHue = () => Math.floor(rand() * 360);

    // 1. Pick a Base Brand Color
    const baseHue = randomHue();
    const strategyCheck = rand();
    let strategy: HarmonyStrategy = 'complementary';
    if (strategyCheck > 0.8) strategy = 'analogous';
    else if (strategyCheck > 0.6) strategy = 'split-complementary';
    else if (strategyCheck > 0.4) strategy = 'triadic';
    else if (strategyCheck > 0.2) strategy = 'monochromatic';

    const hues = generateHarmony(baseHue, strategy);

    const primary = hslToHex(hues[0], 70 + rand() * 30, 40 + rand() * 20);
    const secondaryHue = hues[1] || hues[0];
    const secondary = hslToHex(secondaryHue, 60 + rand() * 30, 45 + rand() * 20);

    // 2. Determine Background Type (Aggressively Tuned for Vibrancy)
    const bgTypeCheck = rand();
    let background: string;
    let text: string;
    let subtext: string;
    let isDark: boolean;

    if (bgTypeCheck > 0.6) {
        // Dark Theme (40%) - Deep, Rich Colors
        const bgHue = (baseHue + 10) % 360;
        background = hslToHex(bgHue, 20 + rand() * 40, 5 + rand() * 15); // Deep saturation, low lightness
        text = '#F8FAFC';
        subtext = '#94A3B8';
        isDark = true;
    } else if (bgTypeCheck > 0.2) {
        // Bold/Vibrant Theme (40%) - "Color Block"
        // High saturation, Mid-Low lightness for impact
        background = hslToHex(hues[0], 60 + rand() * 40, 30 + rand() * 30); // Sat 60-100%, Light 30-60%

        // Calculate distinct contrast
        // Likely dark-ish background vs white text, but let's be sure
        const lum = getLuminance(background);
        isDark = lum < 0.6; // Threshold for white text

        text = isDark ? '#FFFFFF' : '#0F172A';
        subtext = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    } else {
        // Light Theme (20%) - Clean, Minimal
        const bgHue = (baseHue + 10) % 360;
        background = hslToHex(bgHue, 5 + rand() * 10, 92 + rand() * 6); // Very bright
        text = '#0F172A';
        subtext = '#64748B';
        isDark = false;
    }

    // 3. Contrast Safety (Final Sanity Check)
    if (getContrast(background, text) < 4.5) {
        text = isDark ? '#FFFFFF' : '#000000';
    }

    // 4. Generate Name
    // Add a descriptor roughly based on type
    const strategyName = strategy.charAt(0).toUpperCase() + strategy.slice(1);
    const themeName = isDark ? "Dark" : "Bright";
    const name = `${themeName} ${strategyName}`;

    return {
        id: `gen_${id}`, // Ensure we can identify it later
        name,
        primary,
        secondary,
        background,
        text,
        subtext,
        isDark
    };
}
