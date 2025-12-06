import { AVAILABLE_LOGOS, LogoFamily, LogoVariant } from './logoIndex';
import { getBestLogoVariant } from './smartTheme';

// Seeded random number generator for deterministic assignments
function seededRandom(seed: number): number {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Assign a logo family to each base template (deterministic)
const BASE_TEMPLATE_LOGOS: Record<string, LogoFamily> = {};
const SEED = 42069; // Fixed seed for consistency

// Initialize assignments for all base templates
const baseTemplateIds = [
    'template_01', 'template_02', 'template_03', 'template_04', 'template_05',
    'template_06', 'template_07', 'template_08', 'template_09', 'template_10', 'template_11'
];

baseTemplateIds.forEach((templateId, index) => {
    const logoIndex = Math.floor(seededRandom(SEED + index) * AVAILABLE_LOGOS.length);
    BASE_TEMPLATE_LOGOS[templateId] = AVAILABLE_LOGOS[logoIndex];
});

/**
 * Get the appropriate logo variant for a template based on its background color.
 * This ensures color-conscious pairing between logos and template palettes.
 * Template variations get DIFFERENT logos (not just different colors of same logo).
 */
/**
 * Get the appropriate logo variant for a template based on its background color.
 * This ensures color-conscious pairing between logos and template palettes.
 * Template variations get DIFFERENT logos (not just different colors of same logo).
 */
export function getLogoForTemplate(templateId: string, backgroundColor: string, accentColor?: string): LogoVariant {
    // Extract base template ID (remove palette suffix if present)
    // e.g., "template_01_midnight-blue" -> "template_01"
    const parts = templateId.split('_');
    const baseId = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : templateId;

    // Get base logo family for this template
    let logoFamily = BASE_TEMPLATE_LOGOS[baseId];

    if (!logoFamily) {
        // Fallback to first logo if template not found
        console.warn(`No logo assigned for template: ${templateId}, using fallback`);
        logoFamily = AVAILABLE_LOGOS[0];
    }

    // If this is a template variation (has palette suffix), offset the logo
    // This gives each color variation a DIFFERENT logo
    if (parts.length > 2) {
        // CHECK FOR GENERATED VARIANTS FIRST
        if (templateId.includes('_gen_')) {
            // Fix: seedStr must capture the ENTIRE suffix after 'gen', not just one part
            // templateId format: "template_01_gen_template_01_var_0_1"
            const genIndex = parts.indexOf('gen');
            const seedStr = parts.slice(genIndex + 1).join('_');

            if (seedStr) {
                // Simple hash of seed string
                let hash = 0;
                for (let i = 0; i < seedStr.length; i++) {
                    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
                    hash |= 0;
                }

                // UNLINK FROM BASE TEMPLATE: Pick a random LogoFamily based on seed
                // This ensures "Template 1 - Blue" might have a Circle Logo, while "Template 1 - Red" has a Star Logo
                const logoFamilyIndex = Math.abs(hash) % AVAILABLE_LOGOS.length;
                logoFamily = AVAILABLE_LOGOS[logoFamilyIndex];

                // Also randomize the variant index using a secondary hash component
                // (Though getBestLogoVariant below usually overrides this based on color)
            }
        } else {
            // Legacy handling for old palette IDs (if any exist)
            const paletteId = parts.slice(2).join('_');

            // Try to resolve legacy palette (requires dynamic import to avoid circular dep if needed, 
            // but for now we assume PALETTES might be empty in new logic)
            // Skipping legacy complex logic for now as we have fully moved to generated palettes.
        }
    }

    // Use smart selection based on background color
    // This will pick White for dark backgrounds, Black for light backgrounds, etc.
    // If accentColor is provided, it might try to match it (logic inside smartTheme)
    return getBestLogoVariant(backgroundColor, logoFamily, accentColor);
}

/**
 * Get the logo family assigned to a base template (without color selection).
 * Useful for displaying which logo a template uses.
 */
export function getLogoFamilyForTemplate(templateId: string): LogoFamily {
    const parts = templateId.split('_');
    const baseId = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : templateId;
    return BASE_TEMPLATE_LOGOS[baseId] || AVAILABLE_LOGOS[0];
}

/**
 * Get all logo assignments for debugging/display purposes.
 */
export function getAllLogoAssignments(): Record<string, LogoFamily> {
    return { ...BASE_TEMPLATE_LOGOS };
}

/**
 * Get a random logo for a template, avoiding recently used ones.
 * This is used for the "Shuffle Logo" feature.
 */
export function getRandomLogoForTemplate(
    templateId: string,
    backgroundColor: string,
    excludeIds: string[] = []
): LogoVariant {
    // Filter out excluded logos
    const availableLogos = AVAILABLE_LOGOS.filter(
        logo => !excludeIds.includes(logo.id)
    );

    // If we've excluded everything, just use all logos
    const logosToChooseFrom = availableLogos.length > 0 ? availableLogos : AVAILABLE_LOGOS;

    // Pick a random logo family
    const randomIndex = Math.floor(Math.random() * logosToChooseFrom.length);
    const randomFamily = logosToChooseFrom[randomIndex];

    // Use smart color selection
    return getBestLogoVariant(backgroundColor, randomFamily);
}

/**
 * Get smart logo suggestions based on current template and logo.
 * Returns 6-12 logos that would work well with the template.
 */
export function getSmartLogoSuggestions(
    backgroundColor: string,
    currentLogoId?: string,
    count: number = 9
): LogoVariant[] {
    const suggestions: LogoVariant[] = [];

    // Get a diverse set of logos
    const step = Math.floor(AVAILABLE_LOGOS.length / count);

    for (let i = 0; i < count && i * step < AVAILABLE_LOGOS.length; i++) {
        const logoFamily = AVAILABLE_LOGOS[i * step];

        // Skip current logo if provided
        if (currentLogoId && logoFamily.id === currentLogoId) {
            continue;
        }

        // Get the best variant for this background
        const variant = getBestLogoVariant(backgroundColor, logoFamily);
        suggestions.push(variant);
    }

    return suggestions;
}

/**
 * Track logo usage in localStorage to avoid repetition.
 */
export function trackLogoUsage(templateId: string, logoId: string): void {
    if (typeof window === 'undefined') return; // SSR safety

    const key = `cardify_logo_history_${templateId}`;
    try {
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        history.push({ logoId, timestamp: Date.now() });
        // Keep only last 10 logos
        const recentHistory = history.slice(-10);
        localStorage.setItem(key, JSON.stringify(recentHistory));
    } catch (error) {
        console.warn('Failed to track logo usage:', error);
    }
}

/**
 * Get recently used logo IDs for a template.
 */
export function getRecentlyUsedLogos(templateId: string, count: number = 5): string[] {
    if (typeof window === 'undefined') return []; // SSR safety

    const key = `cardify_logo_history_${templateId}`;
    try {
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        return history.slice(-count).map((entry: any) => entry.logoId);
    } catch (error) {
        console.warn('Failed to get logo history:', error);
        return [];
    }
}
