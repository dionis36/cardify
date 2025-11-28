import { LogoFamily } from "@/lib/logoIndex";

export type LogoCategory = 'abstract' | 'nature' | 'animal' | 'tech' | 'business';

// Re-export LogoFamily as Logo for compatibility, or extend it
export type Logo = LogoFamily & {
    category?: LogoCategory; // Optional category if we want to add it later
};

export interface LogoLibrary {
    logos: Logo[];
    categories: LogoCategory[];
}
