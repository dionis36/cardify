// lib/pexelsService.ts

/**
 * Pexels API Service
 * Provides functions to search and fetch photos from Pexels API
 */

const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || '';
const PEXELS_API_BASE = 'https://api.pexels.com/v1';

// Type definitions for Pexels API responses
export interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    avg_color: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
    liked: boolean;
    alt: string;
}

export interface PexelsSearchResponse {
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
    total_results: number;
    next_page?: string;
    prev_page?: string;
}

export interface PexelsCuratedResponse {
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
    next_page?: string;
    prev_page?: string;
}

export class PexelsServiceError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = 'PexelsServiceError';
    }
}

/**
 * Check if Pexels API key is configured
 */
export function isPexelsConfigured(): boolean {
    return !!PEXELS_API_KEY && PEXELS_API_KEY.length > 0;
}

/**
 * Search photos on Pexels
 * @param query - Search query string
 * @param page - Page number (default: 1)
 * @param perPage - Results per page (default: 20, max: 80)
 * @returns Promise with search results
 */
export async function searchPhotos(
    query: string,
    page: number = 1,
    perPage: number = 20
): Promise<PexelsSearchResponse> {
    if (!isPexelsConfigured()) {
        throw new PexelsServiceError(
            'Pexels API key is not configured. Please add NEXT_PUBLIC_PEXELS_API_KEY to your .env.local file.'
        );
    }

    if (!query || query.trim().length === 0) {
        throw new PexelsServiceError('Search query cannot be empty');
    }

    try {
        const url = new URL(`${PEXELS_API_BASE}/search`);
        url.searchParams.append('query', query.trim());
        url.searchParams.append('page', page.toString());
        url.searchParams.append('per_page', Math.min(perPage, 80).toString());

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: PEXELS_API_KEY,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new PexelsServiceError('Invalid Pexels API key', 401);
            } else if (response.status === 429) {
                throw new PexelsServiceError('Rate limit exceeded. Please try again later.', 429);
            } else {
                throw new PexelsServiceError(
                    `Failed to search photos: ${response.statusText}`,
                    response.status
                );
            }
        }

        const data: PexelsSearchResponse = await response.json();
        return data;
    } catch (error) {
        if (error instanceof PexelsServiceError) {
            throw error;
        }
        throw new PexelsServiceError(
            `Network error while searching photos: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Get curated photos from Pexels
 * @param page - Page number (default: 1)
 * @param perPage - Results per page (default: 20, max: 80)
 * @returns Promise with curated photos
 */
export async function getCuratedPhotos(
    page: number = 1,
    perPage: number = 20
): Promise<PexelsCuratedResponse> {
    if (!isPexelsConfigured()) {
        throw new PexelsServiceError(
            'Pexels API key is not configured. Please add NEXT_PUBLIC_PEXELS_API_KEY to your .env.local file.'
        );
    }

    try {
        const url = new URL(`${PEXELS_API_BASE}/curated`);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('per_page', Math.min(perPage, 80).toString());

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: PEXELS_API_KEY,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new PexelsServiceError('Invalid Pexels API key', 401);
            } else if (response.status === 429) {
                throw new PexelsServiceError('Rate limit exceeded. Please try again later.', 429);
            } else {
                throw new PexelsServiceError(
                    `Failed to get curated photos: ${response.statusText}`,
                    response.status
                );
            }
        }

        const data: PexelsCuratedResponse = await response.json();
        return data;
    } catch (error) {
        if (error instanceof PexelsServiceError) {
            throw error;
        }
        throw new PexelsServiceError(
            `Network error while fetching curated photos: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Get the best image URL for a given use case
 * @param photo - Pexels photo object
 * @param size - Desired size ('small' | 'medium' | 'large')
 * @returns Image URL
 */
export function getImageUrl(
    photo: PexelsPhoto,
    size: 'small' | 'medium' | 'large' = 'medium'
): string {
    return photo.src[size] || photo.src.medium;
}
