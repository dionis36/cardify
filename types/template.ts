// types/template.ts (MODIFIED - NEW SPECIFIC PROP INTERFACES)

import { TemplateCategoryKey } from "@/lib/templateCategories";

// Base Konva Node Types
export type KonvaNodeType = "Rect" | "Text" | "Image"; 
export type Orientation = "horizontal" | "vertical"; // Added orientation type

// --- BASE PROPERTIES (Common to ALL Konva Nodes) ---
interface BaseNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible?: boolean;

  // Shadow Props (Common to many Konva nodes)
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

// --- SPECIFIC PROPERTIES ---

export interface TextProps extends BaseNodeProps {
  text: string;
  fontSize: number;
  fill: string; // Text color
  fontFamily: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'underline' | 'line-through' | '';
  fontStyle?: string; // e.g., 'bold italic'
}

export interface RectProps extends BaseNodeProps {
  fill: string; // Shape fill color
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

// FIX: Explicitly define ImageProps to include stroke and strokeWidth
export interface ImageProps extends BaseNodeProps {
  src: string; 
  stroke?: string; 
  strokeWidth?: number; // FIX: Property 'strokeWidth' is now explicitly on ImageProps
}

// --- UNION TYPE (Used by main state/reducer) ---
// KonvaNodeProps is the union of all specific prop types
export type KonvaNodeProps = TextProps | RectProps | ImageProps;

// Existing KonvaNodeDefinition
export interface KonvaNodeDefinition {
  id: string; // unique node id
  type: KonvaNodeType;
  props: KonvaNodeProps; // This holds the union of props
  editable: boolean;
  locked: boolean;
}

/**
 * Card template JSON structure
 */
export interface CardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: Orientation; // Added orientation
  layers: KonvaNodeDefinition[];
  // Metadata for gallery/display
  thumbnail: string;
  preview: string;
  tags: string[];
  category: TemplateCategoryKey;
  colors: string[];
  features: string[];
}