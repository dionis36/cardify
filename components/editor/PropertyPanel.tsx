// components/editor/PropertyPanel.tsx

"use client";

import { KonvaNodeDefinition, KonvaNodeProps, TextProps, RectProps, ImageProps } from "@/types/template"; 
import React, { useCallback } from "react";
import ColorPicker from "./ColorPicker";
// ADDED ICONS for Layer Ordering
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Underline, Bold, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Lock, Unlock } from "lucide-react"; 

type EditorMode = "FULL_EDIT" | "DATA_ONLY";

// --- Helper Component for consistent input styling ---
interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, type = "text", step, min, max, disabled = false }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={typeof value === 'number' ? value.toString() : value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border p-2 rounded text-sm mt-1 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'}`}
      step={step}
      min={min}
      max={max}
      disabled={disabled} 
    />
  </div>
);

// --- Toggle Button for Text Styling ---
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
        className={`p-2 rounded transition-colors duration-100 ${
            active ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`} 
    >
        <Icon size={16} />
    </button>
);


// --- MAIN COMPONENT INTERFACE ---
interface PropertyPanelProps {
  node: KonvaNodeDefinition | null;
  onPropChange: (updates: Partial<KonvaNodeProps>) => void;
  onDefinitionChange: (updates: Partial<KonvaNodeDefinition>) => void;
  mode: EditorMode;
  // NEW PROPS for Layer Ordering
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
  // DESTRUCTURE NEW PROPS
  onMoveToFront, onMoveToBack, onMoveUp, onMoveDown
}: PropertyPanelProps) {
  
  // Custom type to widen the possible keys for the handler
  type AllKonvaPropKeys = keyof TextProps | keyof RectProps | keyof ImageProps; 
  
  const handlePropChange = useCallback((key: string, value: any) => {
    // Asserting the key type here resolves the assignment error
    onPropChange({ [key as AllKonvaPropKeys]: value } as Partial<KonvaNodeProps>);
  }, [onPropChange]);
  
  const handleDefinitionChange = useCallback((key: 'locked' | 'editable' | 'visible', value: boolean) => {
    onDefinitionChange({ [key]: value } as Partial<KonvaNodeDefinition>);
  }, [onDefinitionChange]);
  
  // Helper to toggle lock state
  const handleToggleLock = useCallback(() => {
    handleDefinitionChange('locked', !node?.locked);
  }, [handleDefinitionChange, node]);


  if (!node) {
    return (
      <div className="w-80 border-l bg-gray-50 p-4 shrink-0 overflow-y-auto">
        <p className="text-sm text-gray-500 text-center py-4">Select an element on the canvas to edit its properties.</p>
      </div>
    );
  }

  // --- ACCESS COMMON PROPERTIES DIRECTLY (FIX FOR TYPE ERRORS) ---
  // Access common properties from node.props without using destructuring + rest operator
  const props = node.props;

  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const width = props.width ?? 0;
  const height = props.height ?? 0;
  const rotation = props.rotation ?? 0;
  const opacity = props.opacity ?? 1;
  const visible = props.visible ?? true;
  const shadowColor = props.shadowColor ?? "#000000";
  const shadowBlur = props.shadowBlur ?? 0;
  const shadowOffsetX = props.shadowOffsetX ?? 0;
  const shadowOffsetY = props.shadowOffsetY ?? 0;

  
  // --- CONDITIONAL TYPE-SPECIFIC VARIABLE INITIALIZATION ---
  // Initialize type-specific variables with defaults

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

  // Rect/Image Props variables
  let fill = "#000000"; 
  let stroke = "#000000"; 
  let strokeWidth = 0; 
  let cornerRadius = 0;

  if (node.type === "Text") {
      const textProps = node.props as TextProps;
      text = textProps.text ?? text;
      fontSize = textProps.fontSize ?? fontSize;
      fontFamily = textProps.fontFamily ?? fontFamily;
      align = textProps.align ?? align;
      lineHeight = textProps.lineHeight ?? lineHeight;
      letterSpacing = textProps.letterSpacing ?? letterSpacing;
      textColor = textProps.fill ?? textColor; // Konva uses fill for text color
      textDecoration = textProps.textDecoration ?? textDecoration;
      fontStyle = textProps.fontStyle ?? fontStyle;
      
      isBold = fontStyle?.includes('bold') || false;
      isItalic = fontStyle?.includes('italic') || false;
      isUnderline = textDecoration?.includes('underline') || false;
  }
  
  if (node.type === "Rect" || node.type === "Image") {
    if (node.type === "Rect") {
        // Now TypeScript knows this is RectProps
        const rectProps = node.props as RectProps;
        fill = rectProps.fill ?? fill;
        stroke = rectProps.stroke ?? stroke;
        strokeWidth = rectProps.strokeWidth ?? strokeWidth;
        cornerRadius = rectProps.cornerRadius ?? cornerRadius;
    } else if (node.type === "Image") {
        // Handle ImageProps separately if it has different properties
        const imageProps = node.props as ImageProps;
        // Access only properties that exist on ImageProps
        stroke = imageProps.stroke ?? stroke;
        strokeWidth = imageProps.strokeWidth ?? strokeWidth;
    }
}


  // --- Text Styling Logic (Fix for type 'string' assignment error) ---
  const toggleFontStyle = (style: 'bold' | 'italic') => {
      let newStyle: string = fontStyle || 'normal'; 
      const styleKey = style === 'italic' ? 'italic' : 'bold'; 
      
      const isSet = newStyle.includes(styleKey);

      if (isSet) {
          // Remove the style
          newStyle = newStyle.replace(styleKey, '').trim();
          if (newStyle === '') newStyle = 'normal';
      } else {
          // Add the style
          if (newStyle === 'normal') newStyle = styleKey;
          else newStyle = `${newStyle} ${styleKey}`;
      }
      
      // Assert the final result back to the expected type for the handler
      handlePropChange('fontStyle', newStyle.trim() as TextProps['fontStyle']);
  }

  const toggleTextDecoration = (decoration: 'underline') => {
      const isSet = textDecoration?.includes(decoration) || false;
      handlePropChange('textDecoration', isSet ? '' : decoration);
  }

  const isLocked = node.locked;
  const isLayoutDisabled = mode === "DATA_ONLY";
  const layoutControlsDisabled = isLocked || isLayoutDisabled;


  return (
    <div className="w-80 border-l bg-white p-4 shrink-0 overflow-y-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Properties: {node.type}</h2>
      
      {/* -------------------- GENERAL CONTROLS: Lock/Visibility -------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800">Element Definition</h3>
        <div className="flex justify-between items-center space-x-2">
            
          {/* Lock/Unlock Toggle */}
          <button
              onClick={handleToggleLock}
              className={`flex-1 p-2 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${
                  isLocked ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              title={isLocked ? "Unlock Element (Enable editing)" : "Lock Element (Disable layout editing)"}
          >
              {isLocked ? <Unlock size={14} /> : <Lock size={14} />} {isLocked ? 'Locked' : 'Unlocked'}
          </button>
          
          {/* Visibility Toggle */}
          <button
            onClick={() => handleDefinitionChange('visible', !visible)}
            className={`flex-1 p-2 rounded text-sm font-semibold transition-colors ${
                visible ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
            title={visible ? "Hide Element" : "Show Element"}
          >
            {visible ? '👁️ Visible' : '🙈 Hidden'}
          </button>
        </div>
        <div className="flex justify-between items-center">
            <label className="text-sm text-gray-700">Content Editable</label>
            <input 
                type="checkbox" 
                checked={!!node.editable} 
                onChange={(e) => handleDefinitionChange('editable', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
        </div>
      </div>

      {/* -------------------- LAYER ORDER CONTROLS (NEW SECTION) -------------------- */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">Layer Order</h3>
          <div className="flex justify-between space-x-2">
              <button 
                  onClick={onMoveToBack}
                  disabled={isLocked} // Disable only when locked, parent handles index check
                  className="flex items-center justify-center p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors flex-1 text-sm"
                  title="Move to Back (Bottom Layer)"
              >
                  <ChevronsDown size={14} className="mr-1" /> Back
              </button>
              <button 
                  onClick={onMoveDown}
                  disabled={isLocked}
                  className="flex items-center justify-center p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors flex-1 text-sm"
                  title="Move Down One Layer"
              >
                  <ArrowDown size={14} className="mr-1" /> Down
              </button>
              <button 
                  onClick={onMoveUp}
                  disabled={isLocked}
                  className="flex items-center justify-center p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors flex-1 text-sm"
                  title="Move Up One Layer"
              >
                  <ArrowUp size={14} className="mr-1" /> Up
              </button>
              <button 
                  onClick={onMoveToFront}
                  disabled={isLocked}
                  className="flex items-center justify-center p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors flex-1 text-sm"
                  title="Move to Front (Top Layer)"
              >
                  <ChevronsUp size={14} className="mr-1" /> Front
              </button>
          </div>
      </div>
      
      {/* -------------------- TRANSFORM PROPERTIES -------------------- */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-800">Position & Size</h3>
        <div className="grid grid-cols-2 gap-3">
          <InputGroup label="X (px)" type="number" value={Math.round(x)} step={1} onChange={(v) => handlePropChange('x', Number(v))} disabled={layoutControlsDisabled} />
          <InputGroup label="Y (px)" type="number" value={Math.round(y)} step={1} onChange={(v) => handlePropChange('y', Number(v))} disabled={layoutControlsDisabled} />
          <InputGroup label="Width (px)" type="number" value={Math.round(width)} min={10} step={1} onChange={(v) => handlePropChange('width', Number(v))} disabled={layoutControlsDisabled} />
          <InputGroup label="Height (px)" type="number" value={Math.round(height)} min={10} step={1} onChange={(v) => handlePropChange('height', Number(v))} disabled={layoutControlsDisabled} />
          <InputGroup label="Rotation (°)" type="number" value={Math.round(rotation)} step={1} onChange={(v) => handlePropChange('rotation', Number(v))} disabled={layoutControlsDisabled} />
          <InputGroup label="Opacity (%)" type="number" value={Math.round(opacity * 100)} min={0} max={100} onChange={(v) => handlePropChange('opacity', Number(v) / 100)} disabled={layoutControlsDisabled} />
        </div>
      </div>
      
      {/* -------------------- SHADOW PROPERTIES -------------------- */}
      <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-bold text-gray-800">Shadow</h3>
        
        <ColorPicker 
            label="Shadow Color"
            color={shadowColor || "#000000"}
            onChange={(v) => handlePropChange('shadowColor', v)}
        />

        <InputGroup 
            label="Blur" 
            type="number" 
            value={shadowBlur} 
            min={0}
            step={1}
            onChange={(v) => handlePropChange('shadowBlur', Number(v))} 
        />
        
        <div className="grid grid-cols-2 gap-2">
            <InputGroup 
                label="Offset X" 
                type="number" 
                value={shadowOffsetX} 
                onChange={(v) => handlePropChange('shadowOffsetX', Number(v))} 
            />
            <InputGroup 
                label="Offset Y" 
                type="number" 
                value={shadowOffsetY} 
                onChange={(v) => handlePropChange('shadowOffsetY', Number(v))} 
            />
        </div>
      </div>

      {/* -------------------- TEXT PROPERTIES -------------------- */}
      {node.type === "Text" && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-bold text-gray-800">Text Styling</h3>
          
          <label className="block text-sm font-medium text-gray-700">Text Content</label>
          <textarea
            value={text}
            onChange={(e) => handlePropChange('text', e.target.value)} 
            className="w-full border p-2 rounded text-sm"
            rows={3}
          />
          
          <div className="flex space-x-1 mb-3 bg-white p-1 rounded-lg border">
            {/* Font Style Toggles */}
            <StyleButton 
                icon={Bold} 
                title="Bold (Ctrl+B)" 
                active={isBold} 
                onClick={() => toggleFontStyle('bold')} 
            />
            <StyleButton 
                icon={Type} 
                title="Italic (Ctrl+I)" 
                active={isItalic} 
                onClick={() => toggleFontStyle('italic')} 
                className="italic-icon" 
            />
            <StyleButton 
                icon={Underline} 
                title="Underline (Ctrl+U)" 
                active={isUnderline} 
                onClick={() => toggleTextDecoration('underline')} 
            />
            <div className="w-px bg-gray-300 mx-1"></div>
            
            {/* Alignment Buttons */}
            <StyleButton 
                icon={AlignLeft} 
                title="Align Left" 
                active={align === 'left'} 
                onClick={() => handlePropChange('align', 'left')} 
            />
            <StyleButton 
                icon={AlignCenter} 
                title="Align Center" 
                active={align === 'center'} 
                onClick={() => handlePropChange('align', 'center')} 
            />
            <StyleButton 
                icon={AlignRight} 
                title="Align Right" 
                active={align === 'right'} 
                onClick={() => handlePropChange('align', 'right')} 
            />
            <StyleButton 
                icon={AlignJustify} 
                title="Justify" 
                active={align === 'justify'} 
                onClick={() => handlePropChange('align', 'justify')} 
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InputGroup 
              label="Font Size (px)" 
              type="number" 
              value={fontSize} 
              min={6}
              onChange={(v) => handlePropChange('fontSize', Number(v))} 
            />
            
            <ColorPicker 
                label="Text Color"
                color={textColor}
                onChange={(v) => handlePropChange('fill', v)} // Konva uses 'fill' for text color
            />
          </div>
          
          <label className="block text-sm font-medium text-gray-700 mt-2">Font Family</label>
          <input
            type="text"
            value={fontFamily}
            onChange={(e) => handlePropChange('fontFamily', e.target.value)}
            className="w-full border p-2 rounded text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <InputGroup 
                label="Line Height" 
                type="number" 
                value={lineHeight} 
                step={0.1} 
                min={0.5} 
                onChange={(v) => handlePropChange('lineHeight', Number(v))} 
            />
            <InputGroup 
                label="Letter Spacing" 
                type="number" 
                value={letterSpacing} 
                step={0.1} 
                onChange={(v) => handlePropChange('letterSpacing', Number(v))} 
            />
          </div>

        </div>
      )}

      {/* -------------------- RECT & IMAGE PROPERTIES -------------------- */}
      {(node.type === "Rect" || node.type === "Image") && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-bold text-gray-800">{node.type === "Rect" ? "Shape Styling" : "Border/Image Styling"}</h3>
          
          {node.type === "Rect" && (
            <>
              <ColorPicker 
                label="Fill Color"
                color={fill}
                onChange={(v) => handlePropChange('fill', v)}
              />
              <InputGroup label="Corner Radius (px)" type="number" value={cornerRadius} min={0} onChange={(v) => handlePropChange('cornerRadius', Number(v))} />
            </>
          )}
          
          <div className="border-t pt-3">
              <ColorPicker 
                label="Border Color"
                color={stroke || "#000000"}
                onChange={(v) => handlePropChange('stroke', v)}
              />
              <InputGroup label="Border Width (px)" type="number" value={strokeWidth} min={0} onChange={(v) => handlePropChange('strokeWidth', Number(v))} />
          </div>

        </div>
      )}
    </div>
  );
}