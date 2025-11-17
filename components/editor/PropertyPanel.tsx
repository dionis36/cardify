// components/editor/PropertyPanel.tsx (CORRECTED - Adding nullish coalescing for optional props)

"use client";

import { KonvaNodeDefinition, KonvaNodeProps } from "@/types/template";
import React, { useCallback } from "react";

type EditorMode = "FULL_EDIT" | "DATA_ONLY"; 
type TextAlignment = 'left' | 'center' | 'right';

// --- Helper Component for consistent input styling ---
interface InputGroupProps {
  label: string;
  value: string | number; // MUST be string or number (not undefined)
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
      // Ensure number is converted to string for the input element's value prop
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

// --- Component to handle Text Alignment buttons ---
interface AlignmentControlProps {
    currentAlign: TextAlignment;
    onChange: (newAlign: TextAlignment) => void;
}

const AlignmentControl: React.FC<AlignmentControlProps> = ({ currentAlign, onChange }) => {
    const alignments: { key: TextAlignment, icon: string, title: string }[] = [
        { key: 'left', icon: 'L', title: 'Align Left' },
        { key: 'center', icon: 'C', title: 'Align Center' },
        { key: 'right', icon: 'R', title: 'Align Right' },
    ];

    return (
        <div className="flex justify-between items-center space-x-1">
            <label className="block text-sm font-medium text-gray-700 w-1/2">Text Align</label>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
                {alignments.map(item => (
                    <button
                        key={item.key}
                        title={item.title}
                        onClick={() => onChange(item.key)}
                        className={`p-2 rounded-md text-sm font-semibold transition-colors duration-150 ${
                            currentAlign === item.key ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {item.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};


// --- Property Panel Main Component ---

interface PropertyPanelProps {
  node: KonvaNodeDefinition | null;
  onPropChange: (updates: Partial<KonvaNodeProps>) => void;
  onDefinitionChange: (updates: Partial<KonvaNodeDefinition>) => void;
  mode: EditorMode; 
}

export default function PropertyPanel({ node, onPropChange, onDefinitionChange, mode }: PropertyPanelProps) {
  
  const handlePropChange = useCallback((key: keyof KonvaNodeProps, value: string | number) => {
    // Convert to number if necessary
    let finalValue: string | number;
    if (key === 'fontSize' || key === 'width' || key === 'height' || key === 'rotation' || key === 'strokeWidth' || key === 'cornerRadius' || key === 'x' || key === 'y' || key === 'lineHeight' || key === 'letterSpacing' || key === 'shadowBlur' || key === 'shadowOffsetX' || key === 'shadowOffsetY' || key === 'opacity') {
      // Handle percentage conversion for opacity
      if (key === 'opacity') {
          finalValue = Number(value) / 100;
      } else {
          finalValue = Number(value);
      }
    } else {
      finalValue = value;
    }

    onPropChange({ [key]: finalValue });
  }, [onPropChange]);
  
  const handleLockToggle = useCallback(() => {
    if (node) {
        onDefinitionChange({ locked: !node.locked });
    }
  }, [node, onDefinitionChange]);

  if (!node) {
    return (
      <div className="w-72 bg-gray-50 border-l p-4 flex flex-col items-center justify-center text-gray-500">
        No element selected.
      </div>
    );
  }
  
  // FIX: Destructure props with nullish coalescing to provide default values for optional types
  const { 
    x, y, width, height, rotation, 
    opacity = 1, // Default opacity to 1
    fill = '#000000', stroke = '#000000', strokeWidth = 0, cornerRadius = 0, 
    text = '', 
    fontSize = 16, fontFamily = 'Arial', 
    align = 'left', lineHeight = 1.2, letterSpacing = 0,
    shadowBlur = 0, shadowColor = '#000000', shadowOffsetX = 0, shadowOffsetY = 0
  } = node.props;

  // Disable all property edits in DATA_ONLY mode unless it's a critical data field (e.g., text)
  const isDataOnly = mode === "DATA_ONLY";
  const isTransformDisabled = isDataOnly || node.locked;
  const isTextDisabled = isDataOnly && node.type !== 'Text';


  return (
    <div className="w-72 bg-white border-l p-4 flex flex-col gap-4 overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2 truncate">
        {node.type} Properties
      </h2>
      
      {/* Element Status: Lock/Visibility */}
      <div className="flex justify-between items-center border-b pb-3">
          <p className="text-sm font-medium text-gray-700">Status</p>
          <div className="flex gap-2">
            <button 
                onClick={handleLockToggle}
                className={`p-1.5 rounded text-sm transition-colors ${node.locked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title={node.locked ? "Unlock Element" : "Lock Element"}
            >
                {node.locked ? '🔒 Locked' : '🔓 Unlocked'}
            </button>
          </div>
      </div>


      {/* -------------------- COMMON TRANSFORM PROPERTIES -------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800">Transform</h3>
        
        <div className="grid grid-cols-2 gap-3">
            {/* These properties (x, y, width, height) MUST exist on KonvaNodeProps, so no nullish coalescing is needed here for strict TS, but let's be safe. */}
            <InputGroup label="X Position (px)" type="number" value={x ?? 0} onChange={(v) => handlePropChange('x', v)} disabled={isTransformDisabled} />
            <InputGroup label="Y Position (px)" type="number" value={y ?? 0} onChange={(v) => handlePropChange('y', v)} disabled={isTransformDisabled} />
            <InputGroup label="Width (px)" type="number" value={width ?? 10} onChange={(v) => handlePropChange('width', v)} disabled={isTransformDisabled} min={1} />
            <InputGroup label="Height (px)" type="number" value={height ?? 10} onChange={(v) => handlePropChange('height', v)} disabled={isTransformDisabled} min={1} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Rotation (°)" type="number" value={rotation ?? 0} onChange={(v) => handlePropChange('rotation', v)} disabled={isTransformDisabled} step={1} min={-360} max={360} />
            {/* Opacity is a number between 0 and 1, displayed as a percentage (0-100) */}
            <InputGroup label="Opacity (%)" type="number" value={opacity * 100} onChange={(v) => handlePropChange('opacity', Number(v))} disabled={isTransformDisabled} step={5} min={0} max={100} />
        </div>
      </div>
      
      {/* -------------------- TEXT PROPERTIES -------------------- */}
      {node.type === "Text" && (
        <div className="space-y-3 border-t pt-3">
          <h3 className="text-sm font-bold text-gray-800">Text & Font</h3>
          
          {/* Main Text Content */}
          <div>
            <label className="block text-xs font-medium text-gray-700">Content</label>
            <textarea
              value={text}
              onChange={(e) => handlePropChange('text', e.target.value)}
              className={`w-full border p-2 rounded text-sm mt-1 h-20 resize-y focus:ring-blue-500 focus:border-blue-500 ${isTextDisabled ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'}`}
              disabled={isTextDisabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
              {/* Using coalesced values here */}
              <InputGroup label="Font Size (px)" type="number" value={fontSize} onChange={(v) => handlePropChange('fontSize', v)} disabled={isTextDisabled} min={8} />
              
              {/* Font Family Selector (Placeholder) */}
              <div>
                  <label className="block text-xs font-medium text-gray-700">Font Family</label>
                  <select 
                      value={fontFamily}
                      onChange={(e) => handlePropChange('fontFamily', e.target.value)}
                      className={`w-full border p-2 rounded text-sm mt-1 focus:ring-blue-500 focus:border-blue-500 ${isTextDisabled ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'}`}
                      disabled={isTextDisabled}
                  >
                      <option value="Arial">Arial</option>
                      <option value="Inter Bold">Inter Bold</option>
                      <option value="Inter Regular">Inter Regular</option>
                      <option value="Times New Roman">Times New Roman</option>
                  </select>
              </div>
          </div>
          
          {/* Alignment Control */}
          <AlignmentControl 
              currentAlign={align as TextAlignment}
              onChange={(newAlign) => handlePropChange('align', newAlign)}
          />

          {/* Line Height and Letter Spacing */}
          <div className="grid grid-cols-2 gap-3">
              <InputGroup 
                  label="Line Height" 
                  type="number" 
                  value={lineHeight}
                  onChange={(v) => handlePropChange('lineHeight', v)} 
                  disabled={isTextDisabled} 
                  step={0.1} min={0.5} 
              />
              <InputGroup 
                  label="Character Spacing" 
                  type="number" 
                  value={letterSpacing}
                  onChange={(v) => handlePropChange('letterSpacing', v)} 
                  disabled={isTextDisabled} 
                  step={1} 
              />
          </div>
          
          {/* Fill Color */}
          <label className="block text-sm font-medium text-gray-700">Fill Color</label>
          <input
            type="color"
            value={fill}
            onChange={(e) => handlePropChange('fill', e.target.value)}
            className="w-full h-10 p-1 rounded"
          />

        </div>
      )}

      {/* -------------------- RECT & IMAGE PROPERTIES -------------------- */}
      {(node.type === "Rect" || node.type === "Image") && (
        <div className="space-y-3 border-t pt-3">
          <h3 className="text-sm font-bold text-gray-800">
            {node.type === "Rect" ? "Shape Styling" : "Border/Image Styling"}
          </h3>
          
          {node.type === "Rect" && (
            <>
              {/* Fill Color */}
              <label className="block text-sm font-medium text-gray-700">Fill Color</label>
              <input
                type="color"
                value={fill}
                onChange={(e) => handlePropChange('fill', e.target.value)}
                className="w-full h-10 p-1 rounded"
              />
              <InputGroup label="Corner Radius (px)" type="number" value={cornerRadius} min={0} onChange={(v) => handlePropChange('cornerRadius', Number(v))} disabled={isDataOnly || node.locked} />
            </>
          )}
          
          <div className="border-t pt-3">
              <label className="block text-sm font-medium text-gray-700">Border Color</label>
              <input
                type="color"
                value={stroke}
                onChange={(e) => handlePropChange('stroke', e.target.value)}
                className="w-full h-10 p-1 rounded"
              />
              <InputGroup label="Border Width (px)" type="number" value={strokeWidth} min={0} onChange={(v) => handlePropChange('strokeWidth', Number(v))} disabled={isDataOnly || node.locked} />
          </div>
        </div>
      )}
      
      {/* -------------------- SHADOW PROPERTIES -------------------- */}
      <div className="space-y-3 border-t pt-3">
        <h3 className="text-sm font-bold text-gray-800">Shadow Effects</h3>
        <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Shadow Blur" type="number" value={shadowBlur} onChange={(v) => handlePropChange('shadowBlur', Number(v))} disabled={isDataOnly || node.locked} min={0} />
            <InputGroup label="Shadow Color" type="color" value={shadowColor} onChange={(v) => handlePropChange('shadowColor', v)} disabled={isDataOnly || node.locked} />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Offset X" type="number" value={shadowOffsetX} onChange={(v) => handlePropChange('shadowOffsetX', Number(v))} disabled={isDataOnly || node.locked} />
            <InputGroup label="Offset Y" type="number" value={shadowOffsetY} onChange={(v) => handlePropChange('shadowOffsetY', Number(v))} disabled={isDataOnly || node.locked} />
        </div>
      </div>

    </div>
  );
}
