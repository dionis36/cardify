// components/editor/PropertyPanel.tsx

"use client";

import { KonvaNodeDefinition, KonvaNodeProps, TextProps, RectProps, ImageProps } from "@/types/template"; 
import React, { useCallback } from "react";
import ColorPicker from "./ColorPicker";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Underline, Bold } from "lucide-react"; 

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


interface PropertyPanelProps {
  node: KonvaNodeDefinition | null;
  onPropChange: (updates: Partial<KonvaNodeProps>) => void;
  onDefinitionChange: (updates: Partial<KonvaNodeDefinition>) => void; 
  mode: EditorMode;
}

export default function PropertyPanel({ node, onPropChange, onDefinitionChange, mode }: PropertyPanelProps) {
  
  // Custom type to widen the possible keys for the handler
  type AllKonvaPropKeys = keyof TextProps | keyof RectProps | keyof ImageProps; 
  
  const handlePropChange = useCallback((key: string, value: any) => {
    // Asserting the key type here resolves the assignment error
    onPropChange({ [key as AllKonvaPropKeys]: value } as Partial<KonvaNodeProps>);
  }, [onPropChange]);
  
  const handleDefinitionChange = useCallback((key: 'locked' | 'editable', value: boolean) => {
    onDefinitionChange({ [key]: value });
  }, [onDefinitionChange]);


  if (!node || !node.editable) return null;

  // Determine if layout controls should be disabled
  const isLayoutDisabled = mode === "DATA_ONLY";

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


  return (
    <div className="w-64 bg-gray-50 border-l p-4 flex flex-col gap-5 overflow-y-auto h-full">
      <h2 className="font-semibold text-lg mb-2">Properties: {node.type}</h2>
      
      {/* -------------------- SHARED CONTROLS (Position & Size) -------------------- */}
      <div className="space-y-3 border-b pb-4">
        <h3 className="text-sm font-bold text-gray-800">Position & Size</h3>
        <div className="grid grid-cols-2 gap-2">
          <InputGroup label="X" type="number" value={Math.round(x)} onChange={(v) => handlePropChange('x', Number(v))} disabled={isLayoutDisabled} />
          <InputGroup label="Y" type="number" value={Math.round(y)} onChange={(v) => handlePropChange('y', Number(v))} disabled={isLayoutDisabled} />
          <InputGroup label="W" type="number" value={Math.round(width)} onChange={(v) => handlePropChange('width', Number(v))} disabled={isLayoutDisabled} />
          <InputGroup label="H" type="number" value={Math.round(height)} onChange={(v) => handlePropChange('height', Number(v))} disabled={isLayoutDisabled} />
        </div>
      </div>

      {/* -------------------- TRANSFORM & LOCK -------------------- */}
      <div className="space-y-3 border-b pb-4">
        <h3 className="text-sm font-bold text-gray-800">Transform</h3>
        
        <InputGroup 
            label="Rotation (°)" 
            type="number" 
            value={Math.round(rotation)} 
            min={-360} max={360} 
            onChange={(v) => handlePropChange('rotation', Number(v))} 
            disabled={isLayoutDisabled} 
        />
        
        <InputGroup 
          label="Opacity (%)" 
          type="number" 
          min={0} max={100} 
          step={5}
          value={Math.round(opacity * 100)} 
          onChange={(v) => handlePropChange('opacity', Number(v) / 100)} 
        />
        
        {/* Lock/Hide/Editable Controls */}
        <div className="flex justify-between items-center pt-2">
            <label className="text-sm text-gray-700">Lock Element</label>
            <input 
                type="checkbox" 
                checked={!!node.locked} 
                onChange={(e) => handleDefinitionChange('locked', e.target.checked)}
                className={`w-4 h-4 text-blue-600 border-gray-300 rounded ${isLayoutDisabled ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                disabled={isLayoutDisabled} 
            />
        </div>
        <div className="flex justify-between items-center">
            <label className="text-sm text-gray-700">Hide Element</label>
            <input 
                type="checkbox" 
                checked={!visible} 
                onChange={(e) => handlePropChange('visible', !e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
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
      
      {/* -------------------- SHADOW PROPERTIES -------------------- */}
      <div className="space-y-3 border-b pb-4">
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

      {/* -------------------- TEXT PROPERTIES (Phase 2.1) -------------------- */}
      {node.type === "Text" && (
        <div className="space-y-3 border-b pb-4">
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
        <div className="space-y-3">
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