// types/template.ts
// PHASE 3 UPGRADE: Includes Icons, Complex Shapes, Background Patterns, and Layer Groups

import { TemplateCategoryKey } from "@/lib/templateCategories";

// --- TONE DEFINITION (NEW) ---
export type ToneCategory = 'Corporate' | 'Modern' | 'Creative';

// --- COLOR PALETTE DEFINITION (NEW) ---
export interface ColorPalette {
    id: string;
    name: string;
    primary: string;   // Main brand color
    secondary: string; // Secondary brand color
    accent: string;    // NEW: Highlight/Pop color
    tone: ToneCategory; // NEW: The genius logic tone of this palette
    background: string; // Card background color
    text: string;      // Main text color
    subtext: string;   // Secondary text color
    isDark: boolean;   // Whether this is a dark theme
}

// --- COLOR ROLE DEFINITION (NEW) ---

/**
 * Semantic color roles for template layers.
 * These roles define the design intent of each element,
 * ensuring color variations maintain visual hierarchy.
 */
export type ColorRole =
    | 'surface'         // Background rectangles, base layers
    | 'accent'          // Decorative elements, highlights, patterns
    | 'decorative'      // Secondary decorative shapes
    | 'primary-text'    // Headings, names, titles
    | 'secondary-text'  // Subtitles, contact info, body text
    | 'highlight'       // Call-to-action elements, important shapes
    | 'background';     // Elements that match the background color

/**
 * Maps layer IDs to their semantic color roles.
 * Used in templates to explicitly define design intent.
 */
export interface ColorRoleMap {
    [layerId: string]: ColorRole;
}


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
    // Solid
    color1: string;
    // Gradient
    color2?: string; // Keep for backward compatibility or simple gradients
    gradientType?: 'linear' | 'radial';
    gradientStops?: Array<{ offset: number; color: string }>; // Multi-stop support
    rotation?: number; // For linear gradients and patterns
    // Pattern/Texture
    patternImageURL?: string;
    patternId?: string; // ID for regenerating the pattern (e.g., 'dots', 'grid')
    patternColor?: string; // Color of the pattern elements themselves
    scale?: number; // Scale of the pattern (0.1 to 5)
    opacity?: number; // Opacity of the background layer
    blur?: number; // Optional blur for aesthetic backgrounds
    // Texture specific
    overlayColor?: string; // Color to tint the texture
}

// --- EXPORT OPTIONS (NEW) ---

export type ExportFormat = "PNG" | "PDF";
export type ExportPreset = "web" | "print" | "social"; // Deprecated but kept for compatibility

export interface ExportOptions {
    format: ExportFormat;
    fileName?: string;
    // Internal options
    dpi?: number;
    includeBleed?: boolean;
    bleedSize?: number;
    templateWidth?: number;
    templateHeight?: number;
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

    // Logo Identification
    isLogo?: boolean;
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
    cornerRadius?: number;
    qrMetadata?: {
        value: string;
        fgColor: string;
        bgColor: string;
        dotStyle: 'squares' | 'dots';
        eyeStyle: 'square' | 'round';
        logoUrl?: string;
        contentType: 'Website' | 'Email' | 'Phone' | 'SMS' | 'Contact' | 'Event';
        inputs: Record<string, string>;
    };
    // Image editing properties
    filters?: {
        grayscale?: number;      // 0-100
        sepia?: number;          // 0-100
        brightness?: number;     // 0-200
        contrast?: number;       // 0-200
        saturate?: number;       // 0-200
        blur?: number;           // 0-20 (px)
        hueRotate?: number;      // 0-360 (degrees)
    };
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    // Crop properties
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
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
    data?: string; // Standard single path (backward compat)
    paths?: Array<{ d: string; fillRule?: "nonzero" | "evenodd" }>; // NEW: Multi-path support
    naturalWidth?: number; // Natural SVG width
    naturalHeight?: number; // Natural SVG height
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

// --- LAYER GROUP DEFINITION (NEW) ---

/**
 * Layer Group structure for organizing layers into folders
 */
export interface LayerGroup {
    id: string;
    name: string;
    expanded: boolean; // Whether the group is expanded in the UI
    visible: boolean; // Group-level visibility control
    locked: boolean; // Group-level lock control
    parentGroupId?: string; // For nested groups (optional)
}

// --- CORE NODE DEFINITION ---

// Defines the complete structure for any layer in the template
export type KonvaNodeDefinition =
    | { id: string; type: 'Text'; props: TextProps; editable: boolean; locked: boolean; groupId?: string; }
    | { id: string; type: 'Rect'; props: RectProps; editable: boolean; locked: boolean; groupId?: string; }
    | { id: string; type: 'Image'; props: ImageProps; editable: boolean; locked: boolean; groupId?: string; }
    // Shapes
    | { id: string; type: 'Circle'; props: CircleProps; editable: boolean; locked: boolean; groupId?: string; }
    | { id: string; type: 'Ellipse'; props: EllipseProps; editable: boolean; locked: boolean; groupId?: string; }
    | { id: string; type: 'Star'; props: StarProps; editable: boolean; locked: boolean; groupId?: string; }
    | { id: string; type: 'RegularPolygon'; props: RegularPolygonProps; editable: boolean; locked: boolean; groupId?: string; }
    | { id: string; type: 'Line'; props: LineProps; editable: boolean; locked: boolean; groupId?: string; }
    | { id: string; type: 'Arrow'; props: ArrowProps; editable: boolean; locked: boolean; groupId?: string; }
    | { id: string; type: 'Path'; props: PathProps; editable: boolean; locked: boolean; groupId?: string; }
    // NEW Node Definition
    | { id: string; type: 'Icon'; props: IconProps; editable: boolean; locked: boolean; groupId?: string; };

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

    // (NEW) Color Role Definitions
    colorRoles?: ColorRoleMap;

    layers: KonvaNodeDefinition[];

    // (NEW) Layer Groups
    groups?: LayerGroup[];

    // Metadata for gallery/display
    thumbnail: string;
    preview: string;
    tags: string[];
    category: TemplateCategoryKey;
    colors: string[];
    tone?: ToneCategory; // NEW: The aesthetic tone of the card
    isPro?: boolean; // If true, requires premium
    features: string[];
}

/**
 * Metadata for exporting a template
 */
export interface TemplateExportMetadata {
    name: string;
    category: TemplateCategoryKey;
    tags: string[];
    features: string[];
    colors?: string[]; // Optional, can be auto-extracted from layers
}

/**
 * Request body for template export API
 */
export interface TemplateExportRequest {
    template: CardTemplate;
    metadata: TemplateExportMetadata;
    filename?: string; // Optional custom filename
}

/**
 * Response from template export API
 */
export interface TemplateExportResponse {
    success: boolean;
    filename?: string;
    templateId?: string;
    error?: string;
}
