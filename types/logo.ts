import { LogoFamily } from "@/lib/logoIndex";

export type LogoCategory = 'abstract' | 'nature' | 'animal' | 'tech' | 'business';

export interface VectorLogo {
    id: string;
    name: string;
    category: LogoCategory;
    path: string;
    viewBox: string;
    defaultSize: number;
}

// Union type to support both file-based LogoFamilies and path-based VectorLogos
export type Logo = (LogoFamily | VectorLogo) & {
    category?: LogoCategory;
};

export interface LogoLibrary {
    logos: Logo[];
    categories: LogoCategory[];
}
