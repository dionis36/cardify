// lib/templates.ts (MODIFIED - Enforcing standard dimensions)

// CardTemplate now reflects the new enhanced structure from @/types/template
import { CardTemplate } from "@/types/template"; 
// Assuming a new constants file defines the standard size:
import { 
    STANDARD_CARD_WIDTH, 
    STANDARD_CARD_HEIGHT, 
    STANDARD_CARD_ORIENTATION 
} from "./constants"; 

// Import all template JSON files
import template01JSON from "../public/templates/template-01.json"; 
import template02JSON from "../public/templates/template-02.json";
import template03JSON from "../public/templates/template-03.json"; 
import template04JSON from "../public/templates/template-04.json";

// Map for individual lookup - all templates must conform to the new CardTemplate type
// NOTE: We keep the raw JSON imported here.
const templateMap: Record<string, CardTemplate> = {
  template_01: template01JSON as CardTemplate,
  template_02: template02JSON as CardTemplate,
  template_03: template03JSON as CardTemplate,
  template_04: template04JSON as CardTemplate,
};

/**
 * Helper function to enforce standard dimensions and orientation on a template.
 * This overrides the dimensions read from the JSON files.
 */
const enforceStandardDimensions = (template: CardTemplate): CardTemplate => ({
    ...template,
    width: STANDARD_CARD_WIDTH,
    height: STANDARD_CARD_HEIGHT,
    orientation: STANDARD_CARD_ORIENTATION,
});


/**
 * Function to get all templates as an array, enforcing standard dimensions.
 * Returns an array of the newly enhanced CardTemplate type.
 */
export function loadTemplates(): CardTemplate[] {
  // Use map to apply dimension enforcement to all loaded templates
  return Object.values(templateMap).map(enforceStandardDimensions);
}

/**
 * Function to get single template by id, enforcing standard dimensions.
 * Returns the enhanced CardTemplate type.
 */
export function loadTemplate(id: string): CardTemplate {
  const template = templateMap[id];
  if (!template) {
    throw new Error(`Template with id "${id}" not found`);
  }
  // Enforce standard dimensions on the single loaded template
  return enforceStandardDimensions(template);
}