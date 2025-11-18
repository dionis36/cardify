// types/template.ts (UNIFIED & CLEANED - Removed all QR Code references)

import { TemplateCategoryKey } from "@/lib/templateCategories";

// --- BASE PROPERTIES (Common to ALL Konva Nodes) ---
export interface NodeCommonProps {
  id: string; // unique node id (promoted to common props for consistency)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible?: boolean;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;

  // Shadow Props
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

// --- SPECIFIC PROPERTIES: STANDARD ---

export interface TextProps extends NodeCommonProps {
  text: string;
  fontSize: number;
  fill: string; // Text color overrides common fill/stroke
  fontFamily: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'underline' | 'line-through' | '';
  fontStyle?: string; // e.g., 'bold italic'
}

export interface RectProps extends NodeCommonProps {
  fill: string; // Shape fill color overrides common fill/stroke
  cornerRadius?: number;
}

export interface ImageProps extends NodeCommonProps {
  src: string; 
}

// --- SPECIFIC PROPERTIES: SHAPES ---

export interface CircleProps extends NodeCommonProps {
  radius: number; // For Konva, circle is centered at (x, y)
}
export interface EllipseProps extends NodeCommonProps { 
  radiusX: number;
  radiusY: number;
}
export interface StarProps extends NodeCommonProps { 
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}
export interface RegularPolygonProps extends NodeCommonProps { 
  sides: number;
  radius: number;
}
export interface PathProps extends NodeCommonProps { 
  data: string; // The SVG path string
}
// Line/Arrow inherit NodeCommonProps but use a points array
export interface LineProps extends NodeCommonProps { 
  points: number[]; // [x1, y1, x2, y2, x3, y3, ...]
  tension?: number;
}
// ArrowProps is functionally identical to LineProps for Konva definition
export interface ArrowProps extends LineProps {} 

// --- UNION TYPES ---

// All possible Konva Node Types (QR Code removed)
export type KonvaNodeType = 
  'Text' | 'Rect' | 'Image' 
  | 'Circle' | 'Ellipse' | 'Star' | 'RegularPolygon' 
  | 'Line' | 'Arrow' | 'Path';

// KonvaNodeProps is the union of all specific prop types (QR Code removed)
export type KonvaNodeProps = 
  | TextProps 
  | RectProps 
  | ImageProps 
  | CircleProps 
  | EllipseProps 
  | StarProps 
  | RegularPolygonProps 
  | LineProps 
  | ArrowProps 
  | PathProps;

// --- CORE NODE DEFINITION (Expanded Union Type) ---

// Defines the complete structure for any layer in the template
export type KonvaNodeDefinition = 
  | { id: string; type: 'Text'; props: TextProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Rect'; props: RectProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Image'; props: ImageProps; editable: boolean; locked: boolean; }
  // NEW Shapes
  | { id: string; type: 'Circle'; props: CircleProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Ellipse'; props: EllipseProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Star'; props: StarProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'RegularPolygon'; props: RegularPolygonProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Line'; props: LineProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Arrow'; props: ArrowProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Path'; props: PathProps; editable: boolean; locked: boolean; };

// --- CARD TEMPLATE STRUCTURE ---

export type Orientation = "horizontal" | "vertical"; 

/**
 * Card template JSON structure
 */
export interface CardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: Orientation; 
  layers: KonvaNodeDefinition[]; // Uses the new comprehensive union type
  // Metadata for gallery/display
  thumbnail: string;
  preview: string;
  tags: string[];
  category: TemplateCategoryKey;
  colors: string[];
  features: string[];
}