// components/editor/PropertyPanel.tsx

"use client";

import {
  KonvaNodeDefinition,
  KonvaNodeProps,
  TextProps,
  RectProps,
  ImageProps,
  // ADDED IMPORTS FOR NEW SHAPES
  CircleProps,
  EllipseProps,
  StarProps,
  RegularPolygonProps,
  LineProps,
  ArrowProps,
  PathProps,
  IconProps, // ADDED: Import IconProps for icon editing
  // NEW: Import the rich FontName type
  FontName
} from "@/types/template";
import React, { useCallback } from "react";
// Assuming ColorPicker is a sibling component
import ColorPicker from "./ColorPicker";
// Icons for professional, modern look
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Underline, Bold,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Lock, Unlock,
  Eye, EyeOff, Edit, Move, RotateCw, Settings, Layout, Layers
} from "lucide-react";

// --- FONT OPTIONS LIST (Derived from FontName type in template.ts) ---
// This list MUST match the FontName union type in @/types/template.ts
const FONT_OPTIONS: FontName[] = [
  // Sans-Serif
  "Arial",
  "Verdana",
  "Helvetica",
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "sans-serif",
  // Serif
  "Times New Roman",
  "Georgia",
  "Palatino",
  "serif",
  "Playfair Display",
  "Merriweather",
  // Monospace
  "Courier New",
  "Lucida Console",
  "monospace",
  // Display/Script/Specialty
  "Garamond",
  "Impact",
  "Comic Sans MS",
  "Pacifico",
  "Bebas Neue",
];


// --- Custom Components for Enhanced UI ---

type EditorMode = "FULL_EDIT" | "DATA_ONLY";

/**
 * Enhanced Input Group: Compact, always uses a number input for numerical props.
 */
interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'range';
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, type = "number", step, min, max, unit = 'px', disabled = false }) => (
  <div className="flex flex-col">
    <label className="text-xs font-semibold text-gray-700 mb-1">{label}</label>
    <div className="relative flex items-center">
      <input
        type={type}
        value={typeof value === 'number' ? value.toString() : value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-300 p-2 pr-8 rounded-md text-sm transition-all focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
          }`}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
      />
      {type === 'number' && (
        <span className="absolute right-2 text-xs font-medium text-gray-400 pointer-events-none">
          {unit === 'px' ? 'px' : unit === '%' ? '%' : unit}
        </span>
      )}
    </div>
  </div>
);

/**
 * Toggle Button for Text Styling & Actions: Cleaner, more integrated look.
 */
interface StyleButtonProps {
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  className?: string;
}

const StyleButton: React.FC<StyleButtonProps> = ({ icon: Icon, active, onClick, title, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-2 rounded transition-colors duration-150 flex items-center justify-center text-gray-600 ${active
      ? 'bg-blue-500 text-white hover:bg-blue-600'
      : 'bg-white hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    <Icon size={16} strokeWidth={2} />
  </button>
);

// MODIFIED: Simplified ColorPickerWithSwatch to ensure proper width and vertical alignment in grids.
interface CustomColorPickerProps {
  label?: string;
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  /**
   * When false, the wrapper will not render the textual label.
   * Use this when the parent already displays a label to avoid duplication.
   */
  showLabel?: boolean;
}

const ColorPickerWithSwatch: React.FC<CustomColorPickerProps> = ({ label, color, onChange, disabled = false, showLabel = true }) => (
  <div className="flex flex-col">
    {/* Conditional Rendering: Only render the label element if 'label' exists AND showLabel is true */}
    {showLabel && label && (
      <label className="text-xs font-semibold text-gray-700 mb-1">{label}</label>
    )}

    {/* The ColorPicker component is now responsible for its own w-full behavior. 
        It has been updated in ColorPicker.tsx to use p-2 for vertical alignment. */}
    <ColorPicker
      // Do not pass the label down, as we handle it above, or the parent dictates no label should be shown.
      color={color}
      onChange={onChange}
      disabled={disabled}
    />
  </div>
);


/**
 * Section Container: Clean, collapsible look.
 */
interface SectionContainerProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
}

const SectionContainer: React.FC<SectionContainerProps> = ({ title, icon: Icon, children, defaultOpen = true, disabled = false }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`border-t border-gray-200 pt-4 transition-opacity ${disabled ? 'opacity-60' : ''}`}>
      <button
        className="w-full flex justify-between items-center text-left pb-3 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <h3 className="flex items-center text-sm font-bold text-gray-800 uppercase tracking-wider">
          <Icon size={16} className="mr-2 text-blue-500" />
          {title}
        </h3>
        <ArrowUp size={14} className={`text-gray-500 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
      </button>
      {isOpen && <div className="space-y-4">{children}</div>}
    </div>
  );
};


// --- MAIN COMPONENT INTERFACE ---
interface PropertyPanelProps {
  node: KonvaNodeDefinition | null;
  onPropChange: (updates: Partial<KonvaNodeProps>) => void;
  // FIX: Extend KonvaNodeDefinition to safely include 'visible' which is being used
  onDefinitionChange: (updates: Partial<KonvaNodeDefinition & { visible: boolean }>) => void;
  mode: EditorMode;
  onMoveToFront: () => void;
  onMoveToBack: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function PropertyPanel({
  node,
  onPropChange,
  onDefinitionChange,
  mode,
  onMoveToFront, onMoveToBack, onMoveUp, onMoveDown
}: PropertyPanelProps) {

  // UPDATED: Include all new shape properties in the key union type for KonvaProps (INCLUDING IconProps!)
  type AllKonvaPropKeys = keyof TextProps | keyof RectProps | keyof ImageProps | keyof CircleProps | keyof EllipseProps | keyof StarProps | keyof RegularPolygonProps | keyof LineProps | keyof ArrowProps | keyof PathProps | keyof IconProps;

  const handlePropChange = useCallback((key: string, value: any) => {
    // Convert percentage back to 0-1 opacity scale
    const finalValue = key === 'opacity' && typeof value === 'number' ? value / 100 : value;
    onPropChange({ [key as AllKonvaPropKeys]: finalValue } as Partial<KonvaNodeProps>);
  }, [onPropChange]);

  const handleDefinitionChange = useCallback((key: 'locked' | 'editable' | 'visible', value: boolean) => {
    // FIX: Type assertion to pass 'visible' to KonvaNodeDefinition update
    onDefinitionChange({ [key]: value } as Partial<KonvaNodeDefinition & { visible: boolean }>);
  }, [onDefinitionChange]);

  const handleToggleLock = useCallback(() => {
    handleDefinitionChange('locked', !node?.locked);
  }, [handleDefinitionChange, node]);


  if (!node) {
    return (
      // CHANGE: w-80 changed to w-72
      // FIX SCROLL: Added h-full
      <div className="property-panel w-72 border-l bg-white p-6 shrink-0 overflow-y-auto space-y-6 h-full">
        <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
          <Settings size={24} className="mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">
            Select an element on the canvas to view and edit its properties.
          </p>
        </div>
      </div>
    );
  }

  // --- PROPERTY EXTRACTION AND INITIALIZATION ---
  const props = node.props;

  // FIX: Safely access 'visible' property (which was causing the TS error)
  const isVisible = (node as any).visible ?? true;

  // Common Konva Props
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const width = props.width ?? 0;
  const height = props.height ?? 0;
  const rotation = props.rotation ?? 0;
  const opacity = (props.opacity ?? 1) * 100; // Convert to percentage for display
  const shadowColor = props.shadowColor ?? "#000000";
  const shadowBlur = props.shadowBlur ?? 0;
  const shadowOffsetX = props.shadowOffsetX ?? 0;
  const shadowOffsetY = props.shadowOffsetY ?? 0;

  // Text Props variables
  let text = "";
  let fontSize = 16;
  let fontFamily = "Arial";
  let align: TextProps['align'] = 'left';
  let lineHeight = 1.2;
  let letterSpacing = 0;
  let textColor = "#000000";
  let textDecoration: TextProps['textDecoration'] = '';
  let fontStyle: TextProps['fontStyle'] = 'normal';
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;

  // Shape Props variables (consolidated for all new shapes)
  let fill = "#000000";
  let stroke = "#000000";
  let strokeWidth = 0;
  let cornerRadius = 0;

  // --- Type-specific property assignment and consolidation ---

  if (node.type === "Text") {
    const textProps = node.props as TextProps;
    text = textProps.text ?? text;
    fontSize = textProps.fontSize ?? fontSize;
    // Cast is safe since the default font is included in FontName
    fontFamily = (textProps.fontFamily ?? fontFamily) as FontName;
    align = textProps.align ?? align;
    lineHeight = textProps.lineHeight ?? lineHeight;
    letterSpacing = textProps.letterSpacing ?? letterSpacing;
    textColor = textProps.fill ?? textColor; // Konva uses fill for text color
    textDecoration = textProps.textDecoration ?? textDecoration;
    fontStyle = textProps.fontStyle ?? fontStyle;

    isBold = fontStyle?.includes('bold') || false;
    isItalic = fontStyle?.includes('italic') || false;
    isUnderline = textDecoration?.includes('underline') || false;

  } else if (["Rect", "Circle", "Ellipse", "Star", "RegularPolygon", "Path"].includes(node.type)) {
    // Shapes that support both fill and stroke
    const shapeProps = node.props as RectProps | CircleProps | EllipseProps | StarProps | RegularPolygonProps | PathProps;
    fill = shapeProps.fill ?? fill;
    stroke = shapeProps.stroke ?? stroke;
    strokeWidth = shapeProps.strokeWidth ?? strokeWidth;

    if (node.type === "Rect") {
      cornerRadius = (shapeProps as RectProps).cornerRadius ?? cornerRadius;
    }

  } else if (["Image", "Line", "Arrow"].includes(node.type)) {
    // Shapes that primarily use stroke/border (Image, Line, Arrow)
    const lineProps = node.props as ImageProps | LineProps | ArrowProps;
    stroke = lineProps.stroke ?? stroke;
    strokeWidth = lineProps.strokeWidth ?? strokeWidth;

    if (node.type === "Image") {
      cornerRadius = (lineProps as ImageProps).cornerRadius ?? cornerRadius;
    }
  }


  // --- Text Styling Logic (remains the same) ---
  const toggleFontStyle = (style: 'bold' | 'italic') => {
    let newStyle: string = fontStyle || 'normal';
    const styleKey = style === 'italic' ? 'italic' : 'bold';

    const isSet = newStyle.includes(styleKey);

    if (isSet) {
      newStyle = newStyle.replace(styleKey, '').trim();
      if (newStyle === '') newStyle = 'normal';
    } else {
      if (newStyle === 'normal') newStyle = styleKey;
      else {
        const otherStyle = style === 'italic' ? 'bold' : 'italic';
        if (newStyle.includes(otherStyle)) newStyle = `${otherStyle} ${styleKey}`;
        else newStyle = styleKey;
      }
    }

    handlePropChange('fontStyle', newStyle.trim());
  }

  const toggleTextDecoration = (decoration: 'underline') => {
    const isSet = textDecoration?.includes(decoration) || false;
    handlePropChange('textDecoration', isSet ? '' : decoration);
  }

  const isLocked = !!node.locked;
  const isLayoutDisabled = mode === "DATA_ONLY";
  const layoutControlsDisabled = isLocked || isLayoutDisabled;


  // --- Render Sections Based on Node Type ---
  const panels = [];

  // 1. General Configuration
  panels.push(
    <div key="config" className="space-y-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuration</h3>
      <div className="grid grid-cols-3 gap-2">

        {/* Lock/Unlock Toggle */}
        <button
          onClick={handleToggleLock}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 ${isLocked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          title={isLocked ? "Unlock Element" : "Lock Element"}
        >
          {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
          <span className="text-[10px] font-semibold">{isLocked ? "LOCKED" : "UNLOCKED"}</span> {/* ADDED WORDS */}
        </button>

        {/* Visibility Toggle */}
        <button
          onClick={() => handleDefinitionChange('visible', !isVisible)}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 ${isVisible ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
            }`}
          title={isVisible ? "Hide Element" : "Show Element"}
        >
          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          <span className="text-[10px] font-semibold">{isVisible ? "VISIBLE" : "HIDDEN"}</span> {/* ADDED WORDS */}
        </button>

        {/* Content Editable Toggle */}
        <button
          onClick={() => handleDefinitionChange('editable', !node.editable)}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 ${node.editable ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          title={node.editable ? "Content Editable (ON)" : "Content Editable (OFF)"}
        >
          <Edit size={14} />
          <span className="text-[10px] font-semibold">{node.editable ? "EDITABLE" : "FIXED"}</span> {/* ADDED WORDS */}
        </button>
      </div>
    </div>
  );

  // 2. Layer Order
  panels.push(
    <SectionContainer key="layers" title="Layer Order" icon={Layers} disabled={isLocked}>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onMoveToBack}
          disabled={isLocked}
          className="p-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex flex-col items-center justify-center text-xs"
          title="Move to Back (Bottom Layer)"
        >
          <ChevronsDown size={14} />
          <span className="text-[9px] font-medium mt-1">TO BACK</span> {/* ADDED WORDS */}
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLocked}
          className="p-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex flex-col items-center justify-center text-xs"
          title="Move Down One Layer"
        >
          <ArrowDown size={14} />
          <span className="text-[9px] font-medium mt-1">DOWN</span> {/* ADDED WORDS */}
        </button>
        <button
          onClick={onMoveUp}
          disabled={isLocked}
          className="p-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex flex-col items-center justify-center text-xs"
          title="Move Up One Layer"
        >
          <ArrowUp size={14} />
          <span className="text-[9px] font-medium mt-1">UP</span> {/* ADDED WORDS */}
        </button>
        <button
          onClick={onMoveToFront}
          disabled={isLocked}
          className="p-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex flex-col items-center justify-center text-xs"
          title="Move to Front (Top Layer)"
        >
          <ChevronsUp size={14} />
          <span className="text-[9px] font-medium mt-1">TO FRONT</span> {/* ADDED WORDS */}
        </button>
      </div>
    </SectionContainer>
  );

  // 3. Text Style (Conditional) - PLACED BEFORE APPEARANCE
  if (node.type === "Text") {
    panels.push(
      <SectionContainer key="text" title="Text Style" icon={Type}>

        {/* Text Content - Added max-h-24 and overflow-y-auto */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 mb-1">Content</label>
          <textarea
            value={text}
            onChange={(e) => handlePropChange('text', e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md text-sm transition-all focus:ring-blue-500 focus:border-blue-500 max-h-24 overflow-y-auto"
            rows={3}
            placeholder="Enter text content..."
          />
        </div>

        {/* Style Toggles */}
        <div className="space-y-2 w-fit mx-auto bg-gray-50 p-2 rounded-lg border border-gray-200">
          {/* Row 1: Text Styles - Centered */}
          <div className="flex space-x-2 justify-center">
            <StyleButton icon={Bold} title="Bold" active={isBold} onClick={() => toggleFontStyle('bold')} />
            <StyleButton icon={Type} title="Italic" active={isItalic} onClick={() => toggleFontStyle('italic')} />
            <StyleButton icon={Underline} title="Underline" active={isUnderline} onClick={() => toggleTextDecoration('underline')} />
          </div>

          <div className="w-full bg-gray-300 h-px"></div> {/* Separator */}

          {/* Row 2: Alignments - Centered */}
          <div className="flex space-x-2 justify-center">
            <StyleButton icon={AlignLeft} title="Align Left" active={align === 'left'} onClick={() => handlePropChange('align', 'left')} />
            <StyleButton icon={AlignCenter} title="Align Center" active={align === 'center'} onClick={() => handlePropChange('align', 'center')} />
            <StyleButton icon={AlignRight} title="Align Right" active={align === 'right'} onClick={() => handlePropChange('align', 'right')} />
            <StyleButton icon={AlignJustify} title="Justify" active={align === 'justify'} onClick={() => handlePropChange('align', 'justify')} />
          </div>
        </div>

        {/* Size and Color - Side by side */}
        {/* Size and Color - Block wrapped with mb-4 for separation */}
        <div className="flex flex-col space-y-3 mb-4">
          <InputGroup
            label="Size"
            value={fontSize}
            min={6}
            onChange={(v) => handlePropChange('fontSize', Number(v))}
          />
          <ColorPickerWithSwatch
            label="Color"
            color={textColor}
            onChange={(v) => handlePropChange('fill', v)} // Konva uses 'fill' for text color
          />
        </div>

        {/* NEW: Font Family Dropdown Component */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 mb-1">Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => handlePropChange('fontFamily', e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white"
            style={{ fontFamily: fontFamily }} // Apply selected font style to the select element itself for preview
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
        {/* END NEW: Font Family Dropdown Component */}


        {/* Line Height and Letter Spacing - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <InputGroup
            label="Line Height"
            unit=""
            type="number"
            value={lineHeight}
            step={0.1}
            min={0.5}
            onChange={(v) => handlePropChange('lineHeight', Number(v))}
          />
          <InputGroup
            label="Letter Spacing"
            unit="px"
            type="number"
            value={letterSpacing}
            step={0.1}
            onChange={(v) => handlePropChange('letterSpacing', Number(v))}
          />
        </div>
      </SectionContainer>
    );
  }

  // 4. Icon Properties (NEW SECTION)
  if (node.type === "Icon") {
    const iconProps = node.props as IconProps;
    const iconFill = iconProps.fill ?? '#000000';
    const iconStroke = iconProps.stroke ?? 'transparent';
    const iconStrokeWidth = iconProps.strokeWidth ?? 0;
    const iconWidth = iconProps.width ?? 60;
    const iconHeight = iconProps.height ?? 60;

    // Check if icon is currently square (uniform size)
    const isUniformSize = iconWidth === iconHeight;

    panels.push(
      <SectionContainer key="icon-styling" title="Icon Appearance" icon={Type}>

        {/* Icon Color (Fill) */}
        <ColorPickerWithSwatch
          label="Icon Color"
          color={iconFill}
          onChange={(v) => handlePropChange('fill', v)}
        />

        {/* Icon Border/Stroke */}
        <div className="border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <ColorPickerWithSwatch
              label="Border Color"
              color={iconStroke}
              onChange={(v) => handlePropChange('stroke', v)}
            />
            <InputGroup
              label="Border Width"
              type="number"
              value={iconStrokeWidth}
              min={0}
              onChange={(v) => handlePropChange('strokeWidth', Number(v))}
            />
          </div>
        </div>

        {/* Icon Size - Uniform Control */}
        <div className="border-t border-gray-100 pt-3">
          <InputGroup
            label="Size (Uniform)"
            type="number"
            value={Math.round(isUniformSize ? iconWidth : Math.min(iconWidth, iconHeight))}
            min={1}
            onChange={(v) => {
              const newSize = Number(v);
              // Update both width and height to maintain square aspect ratio
              handlePropChange('width', newSize);
              handlePropChange('height', newSize);
            }}
            disabled={layoutControlsDisabled}
          />
          <p className="text-[10px] text-gray-500 mt-1">
            {isUniformSize ? '✓ Icon is square' : '⚠ Icon is not square - using smaller dimension'}
          </p>
        </div>

        {/* Icon Size - Advanced Controls (Width/Height separately) */}
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <InputGroup
            label="Width"
            type="number"
            value={Math.round(iconWidth)}
            min={1}
            onChange={(v) => handlePropChange('width', Number(v))}
            disabled={layoutControlsDisabled}
          />
          <InputGroup
            label="Height"
            type="number"
            value={Math.round(iconHeight)}
            min={1}
            onChange={(v) => handlePropChange('height', Number(v))}
            disabled={layoutControlsDisabled}
          />
        </div>

      </SectionContainer>
    );
  }

  // 5. Shape & Border Properties (Consolidated for all shapes) - MOVED UP
  if (["Rect", "Circle", "Ellipse", "Star", "RegularPolygon", "Path", "Image", "Line", "Arrow"].includes(node.type)) {
    panels.push(
      <SectionContainer key="shape" title={node.type.includes("Image") ? "Border/Fill" : "Appearance"} icon={Layout}>

        {/* Fill Color and Shape-Specific Properties (Grid for uniformity) */}
        {["Rect", "Circle", "Ellipse", "Star", "RegularPolygon", "Path", "Image"].includes(node.type) && (
          <div className="grid grid-cols-2 gap-3 pb-2">
            {/* Fill Color - Only for shapes, not Image */}
            {node.type !== "Image" ? (
              <ColorPickerWithSwatch
                label="Fill Color"
                color={fill}
                onChange={(v) => handlePropChange('fill', v)}
              />
            ) : (
              <div /> // Spacer for Image
            )}

            {/* Corner Radius (For Rect and Image) or Empty Space */}
            {node.type === "Rect" || node.type === "Image" ? (
              <InputGroup
                label="Corner Radius"
                value={cornerRadius}
                min={0}
                onChange={(v) => handlePropChange('cornerRadius', Number(v))}
              />
            ) : (
              <div /> // Placeholder to maintain the 2-column grid layout for other shapes
            )}
          </div>
        )}

        {/* Stroke/Border Properties (Always in a 2-column grid) */}
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <ColorPickerWithSwatch
            label={node.type === "Image" ? "Border Color" : "Stroke Color"}
            color={stroke || "#000000"}
            onChange={(v) => handlePropChange('stroke', v)}
          />
          <InputGroup
            label={node.type === "Image" ? "Border Width" : "Stroke Width"}
            value={strokeWidth}
            min={0}
            onChange={(v) => handlePropChange('strokeWidth', Number(v))}
          />
        </div>
      </SectionContainer>
    );
  }


  // 5. Transform Properties - MOVED DOWN
  panels.push(
    <SectionContainer key="transform" title="Transform" icon={Move} disabled={layoutControlsDisabled}>
      <div className="grid grid-cols-3 gap-3">
        <InputGroup label="X" value={Math.round(x)} step={1} onChange={(v) => handlePropChange('x', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Y" value={Math.round(y)} step={1} onChange={(v) => handlePropChange('y', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Rot" unit="°" value={Math.round(rotation)} step={1} onChange={(v) => handlePropChange('rotation', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Width" value={Math.round(width)} min={1} step={1} onChange={(v) => handlePropChange('width', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Height" value={Math.round(height)} min={1} step={1} onChange={(v) => handlePropChange('height', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Opacity" unit="%" type="number" value={Math.round(opacity)} min={0} max={100} onChange={(v) => handlePropChange('opacity', Number(v))} disabled={layoutControlsDisabled} />
      </div>
    </SectionContainer>
  );


  // 6. Shadow Properties
  panels.push(
    <SectionContainer key="shadow" title="Shadow" icon={RotateCw} defaultOpen={false}>

      {/* No showLabel needed here, ColorPickerWithSwatch handles the label */}
      <ColorPickerWithSwatch
        label="Shadow Color"
        color={shadowColor || "#000000"}
        onChange={(v) => handlePropChange('shadowColor', v)}
      />

      <InputGroup
        label="Blur"
        value={shadowBlur}
        min={0}
        step={1}
        onChange={(v) => handlePropChange('shadowBlur', Number(v))}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputGroup
          label="Offset X"
          value={shadowOffsetX}
          onChange={(v) => handlePropChange('shadowOffsetX', Number(v))}
        />
        <InputGroup
          label="Offset Y"
          value={shadowOffsetY}
          onChange={(v) => handlePropChange('shadowOffsetY', Number(v))}
        />
      </div>
    </SectionContainer>
  );

  return (
    // CHANGE: w-80 changed to w-72
    // FIX LAYER 4: Add property-panel class to outermost div to prevent focus loss issues
    // FIX SCROLL: Added h-full to ensure scrollbar appears when content overflows
    <div className="property-panel w-72 border-l bg-white p-6 shrink-0 overflow-y-auto space-y-6 h-full">
      <h2 className="text-2xl font-extrabold text-gray-900 border-b border-gray-200 pb-3">
        {node.type} Properties 🎨
      </h2>

      {panels}
    </div>
  );
}




