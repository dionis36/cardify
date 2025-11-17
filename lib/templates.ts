// lib/templates.ts (MODIFIED)

// CardTemplate now reflects the new enhanced structure from @/types/template
import { CardTemplate } from "@/types/template"; 

// Import all template JSON files
import template01JSON from "../public/templates/template-01.json"; 
import template02JSON from "../public/templates/template-02.json";
import template03JSON from "../public/templates/template-03.json"; // NEW TEMPLATE IMPORT

// Map for individual lookup - all templates must conform to the new CardTemplate type
const templateMap: Record<string, CardTemplate> = {
  template_01: template01JSON as CardTemplate,
  template_02: template02JSON as CardTemplate,
  template_03: template03JSON as CardTemplate, // ADD NEW TEMPLATE
};

/**
 * Function to get all templates as an array.
 * Returns an array of the newly enhanced CardTemplate type.
 */
export function loadTemplates(): CardTemplate[] {
  return Object.values(templateMap);
}

/**
 * Function to get single template by id.
 * Returns the enhanced CardTemplate type.
 */
export function loadTemplate(id: string): CardTemplate {
  const template = templateMap[id];
  if (!template) {
    throw new Error(`Template with id "${id}" not found`);
  }
  return template;
}