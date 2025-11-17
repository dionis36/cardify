// lib/templateCategories.ts

/**
 * Defines the categories available for filtering and organizing card templates.
 * Using 'as const' provides literal union types for strong typing.
 */
export const TEMPLATE_CATEGORIES = {
  professional: "Professional & Corporate",
  creative: "Creative & Artistic", 
  minimal: "Minimal & Clean",
  bold: "Bold & Colorful",
  vintage: "Vintage & Classic",
} as const;

// Utility type to extract the string keys of the categories
export type TemplateCategoryKey = keyof typeof TEMPLATE_CATEGORIES;