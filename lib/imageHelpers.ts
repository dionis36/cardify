// lib/imageHelpers.ts

/**
 * Image Helper Utilities
 * Functions for image manipulation and transformation
 */

export interface ImageFilters {
    grayscale?: number;      // 0-100
    sepia?: number;          // 0-100
    brightness?: number;     // 0-200
    contrast?: number;       // 0-200
    saturate?: number;       // 0-200
    blur?: number;           // 0-20 (px)
    hueRotate?: number;      // 0-360 (degrees)
}

/**
 * Generate CSS filter string from filter object
 * @param filters - Object containing filter values
 * @returns CSS filter string
 */
export function generateFilterString(filters?: ImageFilters): string {
    if (!filters) return '';

    const filterParts: string[] = [];

    if (filters.grayscale !== undefined && filters.grayscale > 0) {
        filterParts.push(`grayscale(${filters.grayscale}%)`);
    }

    if (filters.sepia !== undefined && filters.sepia > 0) {
        filterParts.push(`sepia(${filters.sepia}%)`);
    }

    if (filters.brightness !== undefined && filters.brightness !== 100) {
        filterParts.push(`brightness(${filters.brightness}%)`);
    }

    if (filters.contrast !== undefined && filters.contrast !== 100) {
        filterParts.push(`contrast(${filters.contrast}%)`);
    }

    if (filters.saturate !== undefined && filters.saturate !== 100) {
        filterParts.push(`saturate(${filters.saturate}%)`);
    }

    if (filters.blur !== undefined && filters.blur > 0) {
        filterParts.push(`blur(${filters.blur}px)`);
    }

    if (filters.hueRotate !== undefined && filters.hueRotate !== 0) {
        filterParts.push(`hue-rotate(${filters.hueRotate}deg)`);
    }

    return filterParts.join(' ');
}

/**
 * Calculate scale values for flip transformations
 * @param flipHorizontal - Whether to flip horizontally
 * @param flipVertical - Whether to flip vertically
 * @returns Object with scaleX and scaleY values
 */
export function getFlipTransform(
    flipHorizontal?: boolean,
    flipVertical?: boolean
): { scaleX: number; scaleY: number } {
    return {
        scaleX: flipHorizontal ? -1 : 1,
        scaleY: flipVertical ? -1 : 1,
    };
}

/**
 * Validate if a URL is a valid image URL
 * @param url - URL to validate
 * @returns true if valid image URL
 */
export function validateImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    try {
        const urlObj = new URL(url);
        const validProtocols = ['http:', 'https:', 'data:'];

        if (!validProtocols.includes(urlObj.protocol)) {
            return false;
        }

        // Check for common image extensions or data URLs
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const pathname = urlObj.pathname.toLowerCase();

        return (
            urlObj.protocol === 'data:' ||
            imageExtensions.some(ext => pathname.endsWith(ext)) ||
            pathname.includes('/image/') ||
            pathname.includes('/photo/')
        );
    } catch {
        return false;
    }
}

/**
 * Convert File to base64 data URL
 * @param file - File object
 * @returns Promise with base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read file as data URL'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Load image and get dimensions
 * @param url - Image URL
 * @returns Promise with image dimensions
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Store recently used image in localStorage
 * @param imageUrl - Image URL to store
 * @param maxRecent - Maximum number of recent images to keep (default: 20)
 */
export function addToRecentImages(imageUrl: string, maxRecent: number = 20): void {
    try {
        const stored = localStorage.getItem('cardify_recent_images');
        const recent: string[] = stored ? JSON.parse(stored) : [];

        // Remove if already exists to avoid duplicates
        const filtered = recent.filter(url => url !== imageUrl);

        // Add to beginning
        filtered.unshift(imageUrl);

        // Limit to maxRecent
        const limited = filtered.slice(0, maxRecent);

        localStorage.setItem('cardify_recent_images', JSON.stringify(limited));
    } catch (error) {
        console.warn('Failed to save recent image:', error);
    }
}

/**
 * Get recently used images from localStorage
 * @returns Array of recent image URLs
 */
export function getRecentImages(): string[] {
    try {
        const stored = localStorage.getItem('cardify_recent_images');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to load recent images:', error);
        return [];
    }
}

/**
 * Clear recent images from localStorage
 */
export function clearRecentImages(): void {
    try {
        localStorage.removeItem('cardify_recent_images');
    } catch (error) {
        console.warn('Failed to clear recent images:', error);
    }
}
