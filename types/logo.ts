export type LogoCategory = 'abstract' | 'nature' | 'animal' | 'tech' | 'business';

export interface Logo {
    id: string;
    name: string;
    category: LogoCategory;
    path: string; // SVG path data
    viewBox: string; // SVG viewBox attribute
    defaultSize: number; // Default width/height in pixels
}

export interface LogoLibrary {
    logos: Logo[];
    categories: LogoCategory[];
}
