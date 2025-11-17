// types/template.ts (UPGRADED for Phase 2.1 & 2.3)

// UPGRADE: Expanded KonvaNodeType for Phase 2.3
export type KonvaNodeType = 
  | "Rect" 
  | "Text" 
  | "Image"
  | "Circle"       // NEW
  | "Ellipse"      // NEW
  | "Star"         // NEW
  | "RegularPolygon" // NEW
  | "Line";        // NEW (Simplified: omitting 'Path' for now as it needs SVG data)

// Define specific Konva node props with explicit types
export interface KonvaNodeProps {
  // Common Transform Props
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible?: boolean;

  // Shadow Props
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Text Specific (Phase 2.1)
  text?: string;
  fontSize?: number;
  fill?: string; // Text/Rect fill color
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  
  // NEW: Rich Text Controls (Phase 2.1)
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic'; // For Bold/Italic
  textDecoration?: 'none' | 'underline' | 'line-through' | 'underline line-through'; // For Underline

  // Rect/Image Specific
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number; // Rect only
  src?: string; // Image only

  // NEW: Shape Specific Properties (Phase 2.3)
  radius?: number; // Circle/Star
  innerRadius?: number; // Star
  outerRadius?: number; // Star
  numPoints?: number; // Star/RegularPolygon
  sides?: number; // RegularPolygon
}

export interface KonvaNodeDefinition {
  id: string; // unique node id
  type: KonvaNodeType;
  props: KonvaNodeProps; // Use the specific props interface
  editable: boolean; // can user select and edit
  locked: boolean; // can user move/resize (used in previous step)
}

// Card template JSON structure (UPDATED for Orientation/Bleed)
export interface CardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: KonvaNodeDefinition[];
  thumbnail?: string; // optional path to thumbnail image
  tags?: string[];
  orientation: 'horizontal' | 'vertical';
}