import { CardTemplate } from "@/types/template";
import { loadTemplates } from "./templates";
import { generateVariations } from "./templateVariations";
import { shuffleArray } from "./utils";

export type SortOption = 'popular' | 'newest' | 'name';

export interface TemplateFilterOptions {
    category?: string;
    tone?: string;
    color?: string; // Hex or name (e.g., 'blue')
    search?: string;
    tags?: string[];
    sortBy?: SortOption;
}

/**
 * Advanced registry to manage template retrieval, filtering, and sorting.
 * In a real app, this would interface with a database/API.
 */
class TemplateRegistry {
    private templates: CardTemplate[] = [];
    private initialized: boolean = false;

    constructor() {
        // Lazy initialization
    }

    private ensureInitialized() {
        if (!this.initialized) {
            const baseTemplates = loadTemplates();
            // Generate variations for each base template
            const allTemplates = baseTemplates.flatMap(t => generateVariations(t));

            // Randomize the order so variations of the same template aren't grouped together
            this.templates = shuffleArray(allTemplates);

            this.initialized = true;
        }
    }

    public getAllTemplates(): CardTemplate[] {
        this.ensureInitialized();
        return this.templates;
    }

    public getTemplateById(id: string): CardTemplate | undefined {
        this.ensureInitialized();
        return this.templates.find(t => t.id === id);
    }

    public getTemplates(options: TemplateFilterOptions = {}): CardTemplate[] {
        this.ensureInitialized();
        let results = [...this.templates];

        // 1. Search (Name, Tags, Category)
        if (options.search) {
            const query = options.search.toLowerCase();
            results = results.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.tags.some(tag => tag.toLowerCase().includes(query)) ||
                t.category.toLowerCase().includes(query)
            );
        }

        // 2. Category Filter
        if (options.category && options.category !== 'All') {
            results = results.filter(t => t.category === options.category);
        }

        // 3. Tone Filter (NEW)
        if (options.tone && options.tone !== 'All') {
            results = results.filter(t => t.tone === options.tone);
        }

        // 4. Color Filter (Basic implementation - checks if template tags or colors include the color name)
        if (options.color) {
            const colorQuery = options.color.toLowerCase();
            results = results.filter(t =>
                t.colors.some(c => c.toLowerCase().includes(colorQuery)) ||
                t.tags.some(tag => tag.toLowerCase() === colorQuery)
            );
        }

        // 5. Sorting
        if (options.sortBy) {
            switch (options.sortBy) {
                case 'name':
                    results.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'newest':
                    // Assuming higher IDs are newer for now, or we'd need a createdAt field
                    results.sort((a, b) => b.id.localeCompare(a.id));
                    break;
                case 'popular':
                    // Mock popularity
                    results.sort((a, b) => b.name.length - a.name.length);
                    break;
            }
        }

        return results;
    }

    public getCategories(): string[] {
        this.ensureInitialized();
        const categories = new Set(this.templates.map(t => t.category));
        return Array.from(categories).sort();
    }

    public getAvailableColors(): string[] {
        // Return a curated list of colors available in the library
        return ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Dark', 'Light', 'Gradient'];
    }
}

export const templateRegistry = new TemplateRegistry();
