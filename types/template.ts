// types/template.ts
// PHASE 3 UPGRADE: Includes Icons, Complex Shapes, and Background Patterns

import { TemplateCategoryKey } from "@/lib/templateCategories";

// --- FONT DEFINITIONS ---

export type FontName = 
  // Sans-Serif
  | "Arial" 
  | "Verdana" 
  | "Helvetica" 
  | "Inter" 
  | "Roboto" 
  | "Open Sans" 
  | "Lato" 
  | "Montserrat" 
  | "Poppins" 
  | "sans-serif"
  // Serif
  | "Times New Roman" 
  | "Georgia" 
  | "Palatino" 
  | "serif"
  | "Playfair Display"
  | "Merriweather"
  // Monospace
  | "Courier New"
  | "Lucida Console"
  | "monospace"
  // Display/Script/Specialty
  | "Garamond"
  | "Impact"
  | "Comic Sans MS"
  | "Pacifico"
  | "Bebas Neue";

// --- BACKGROUND DEFINITIONS (NEW) ---

export type BackgroundType = 'solid' | 'gradient' | 'pattern' | 'texture';

export interface BackgroundPattern {
  type: BackgroundType;
  // For solids: color1 is the fill. 
  // For gradients: color1=start, color2=end.
  color1: string; 
  color2?: string;
  // For patterns/textures:
  patternImageURL?: string; 
  scale?: number; // Scale of the pattern (0.1 to 5)
  rotation?: number; // Rotation of the pattern texture
  opacity?: number; // Opacity of the background layer
  blur?: number; // Optional blur for aesthetic backgrounds
}

// --- BASE PROPERTIES (Common to ALL Konva Nodes) ---
export interface NodeCommonProps {
  id: string; 
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
  
  // Classification for UI/Filtering (NEW)
  category?: 'Icon' | 'ComplexShape' | 'BasicShape' | 'Text' | 'Image';

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
  fill: string; 
  fontFamily: FontName; 
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'underline' | 'line-through' | '';
  fontStyle?: string; 
}

export interface RectProps extends NodeCommonProps {
  fill: string; 
  cornerRadius?: number;
}

export interface ImageProps extends NodeCommonProps {
  src: string; 
}

// --- SPECIFIC PROPERTIES: SHAPES & ICONS ---

// (NEW) Icons are Paths with metadata for the Icon Library
export interface IconProps extends NodeCommonProps {
  data: string; // The SVG path string
  iconName: string; // The Lucide icon name (e.g., 'Mail', 'Heart') used for replacement logic
  category: 'Icon'; // Strictly typed category
}

// (NEW) Complex Shapes (e.g. Blobs, Flowers) usually defined via Paths
export interface ComplexShapeProps extends NodeCommonProps {
  data: string; // The SVG path string
  category: 'ComplexShape';
}

export interface PathProps extends NodeCommonProps { 
  data: string; // Standard SVG path
}

export interface CircleProps extends NodeCommonProps {
  radius: number; 
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

export interface LineProps extends NodeCommonProps { 
  points: number[]; 
  tension?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

export interface ArrowProps extends LineProps {
  pointerLength?: number;
  pointerWidth?: number;
} 

// --- UNION TYPES ---

// All possible Konva Node Types (Added 'Icon')
export type KonvaNodeType = 
  | 'Text' | 'Rect' | 'Image' 
  | 'Circle' | 'Ellipse' | 'Star' | 'RegularPolygon' 
  | 'Line' | 'Arrow' | 'Path'
  | 'Icon'; // <-- NEW

// KonvaNodeProps is the union of all specific prop types
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
  | PathProps
  | IconProps; // <-- NEW

// --- CORE NODE DEFINITION ---

// Defines the complete structure for any layer in the template
export type KonvaNodeDefinition = 
  | { id: string; type: 'Text'; props: TextProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Rect'; props: RectProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Image'; props: ImageProps; editable: boolean; locked: boolean; }
  // Shapes
  | { id: string; type: 'Circle'; props: CircleProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Ellipse'; props: EllipseProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Star'; props: StarProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'RegularPolygon'; props: RegularPolygonProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Line'; props: LineProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Arrow'; props: ArrowProps; editable: boolean; locked: boolean; }
  | { id: string; type: 'Path'; props: PathProps; editable: boolean; locked: boolean; }
  // NEW Node Definition
  | { id: string; type: 'Icon'; props: IconProps; editable: boolean; locked: boolean; };

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
  
  // (NEW) Background State
  background: BackgroundPattern;

  layers: KonvaNodeDefinition[]; 
  
  // Metadata for gallery/display
  thumbnail: string;
  preview: string;
  tags: string[];
  category: TemplateCategoryKey;
  colors: string[];
  features: string[];
}