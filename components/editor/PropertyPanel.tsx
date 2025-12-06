"use client";

import React, { useState } from "react";
import {
  Type,
  Layout,
  Move,
  Layers,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCw,
  Crop,
  Settings,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown
} from "lucide-react";
import { KonvaNodeDefinition, TextProps, IconProps, ImageProps } from "@/types/template";
import { getNodeCapabilities } from "@/lib/capabilities";

// --- Helper Components ---

const SectionContainer = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  disabled = false
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-700">
          <Icon size={16} />
          <span className="text-xs font-bold uppercase tracking-wide">{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};

const InputGroup = ({
  label,
  value,
  onChange,
  type = "number",
  min,
  max,
  step,
  unit,
  disabled = false
}: {
  label: string;
  value: number | string;
  onChange: (val: string | number) => void;
  type?: "text" | "number" | "range";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) => (
  <div className="flex flex-col space-y-1">
    <div className="flex justify-between">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {type === "range" && <span className="text-xs text-gray-500">{value}{unit}</span>}
    </div>
    <div className="flex items-center gap-2">
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${disabled ? 'bg-gray-100' : 'bg-white'}`}
      />
      {unit && type !== "range" && <span className="text-xs text-gray-500 font-medium">{unit}</span>}
    </div>
  </div>
);

const ColorPickerWithSwatch = ({
  label,
  color,
  onChange,
  disabled = false
}: {
  label: string;
  color: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs font-semibold text-gray-600">{label}</label>
    <div className={`flex items-center gap-2 border border-gray-300 p-1 rounded-md ${disabled ? 'bg-gray-100' : 'bg-white'}`}>
      <div className="relative w-6 h-6 rounded border border-gray-200 shadow-sm cursor-pointer" style={{ backgroundColor: color }}>
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Click to pick color"
        />
      </div>
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 text-xs font-mono uppercase outline-none bg-transparent"
        placeholder="#000000"
      />
    </div>
  </div>
);

const StyleButton = ({
  icon: Icon,
  title,
  active,
  onClick,
  disabled = false
}: {
  icon: any;
  title: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-md transition-all ${active
      ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
      : "text-gray-600 hover:bg-gray-100 border border-transparent"
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon size={16} />
  </button>
);

const FONT_OPTIONS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", // Sans
  "Playfair Display", "Merriweather", // Serif
  "Pacifico", "Bebas Neue", "Dancing Script", "Oswald" // Display & Handwriting
];

// --- Main Component ---

interface PropertyPanelProps {
  node: KonvaNodeDefinition | null;
  onPropChange: (nodeId: string, updates: Partial<any>) => void;
  onDefinitionChange: (nodeId: string, updates: Partial<KonvaNodeDefinition>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToFront: () => void;
  onMoveToBack: () => void;
  // New prop for entering crop mode
  onEnterCropMode?: () => void;
}

export default function PropertyPanel({
  node,
  onPropChange,
  onDefinitionChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveToFront,
  onMoveToBack,
  onEnterCropMode
}: PropertyPanelProps) {
  if (!node) {
    return (
      <div className="property-panel w-80 border-l bg-gray-50 flex flex-col items-center justify-center h-full text-gray-400">
        <Layout size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Select an element to edit</p>
      </div>
    );
  }

  const {
    id,
    props: {
      x, y, width, height, rotation, opacity, visible,
      fill, stroke, strokeWidth, cornerRadius,
      shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
      text, fontSize, fontFamily, align, lineHeight, letterSpacing, textDecoration, fontStyle,
      // Image specific
      filters, flipHorizontal, flipVertical
    },
    locked: isLocked
  } = node as any; // Using any for easier access to union props, but types are safe via guards

  // Helper to update props
  const handlePropChange = (key: string, value: any) => {
    onPropChange(id, { [key]: value });
  };

  // Helper to update definition (locked, visible, etc.)
  const handleDefinitionChange = (key: string, value: any) => {
    onDefinitionChange(id, { [key]: value });
  };

  // Text Style Helpers
  const isBold = fontStyle?.includes('bold');
  const isItalic = fontStyle?.includes('italic');
  const isUnderline = textDecoration === 'underline';

  const toggleFontStyle = (style: string) => {
    let currentStyle = fontStyle || 'normal';
    if (currentStyle.includes(style)) {
      currentStyle = currentStyle.replace(style, '').trim();
    } else {
      currentStyle = `${currentStyle} ${style}`.trim();
    }
    handlePropChange('fontStyle', currentStyle);
  };

  const toggleTextDecoration = (decoration: string) => {
    handlePropChange('textDecoration', textDecoration === decoration ? '' : decoration);
  };

  const textColor = fill || "#000000";
  const isVisible = visible ?? true;
  const layoutControlsDisabled = isLocked;

  // --- Render Sections ---

  const panels = [];

  // 1. Quick Actions (Always Visible)
  panels.push(
    <div key="quick-actions" className="grid grid-cols-2 gap-2 mb-2">
      <div className="col-span-2 grid grid-cols-4 gap-2">
        <button
          onClick={() => handleDefinitionChange('locked', !isLocked)}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 ${isLocked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          title={isLocked ? "Unlock Element" : "Lock Element"}
        >
          {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
          <span className="text-[10px] font-semibold">{isLocked ? "LOCKED" : "UNLOCKED"}</span>
        </button>
        <button
          onClick={() => handleDefinitionChange('visible', !isVisible)}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 ${isVisible ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'}`}
          title={isVisible ? "Hide Element" : "Show Element"}
        >
          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          <span className="text-[10px] font-semibold">{isVisible ? "VISIBLE" : "HIDDEN"}</span>
        </button>
        <button
          onClick={() => handleDefinitionChange('editable', !node.editable)}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 ${node.editable ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          title={node.editable ? "Content Editable (ON)" : "Content Editable (OFF)"}
        >
          <Edit size={14} />
          <span className="text-[10px] font-semibold">{node.editable ? "EDITABLE" : "FIXED"}</span>
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100"
          title="Delete Element"
          disabled={isLocked}
        >
          <Trash2 size={14} />
          <span className="text-[10px] font-semibold">DELETE</span>
        </button>
      </div>
    </div>
  );

  // 2. Layer Order
  panels.push(
    <SectionContainer key="layers" title="Layer Order" icon={Layers} disabled={isLocked}>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={onMoveToBack} disabled={isLocked} className="p-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex flex-col items-center justify-center text-xs" title="Move to Back (Bottom Layer)">
          <ChevronsDown size={14} />
          <span className="text-[9px] font-medium mt-1">TO BACK</span>
        </button>
        <button onClick={onMoveDown} disabled={isLocked} className="p-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex flex-col items-center justify-center text-xs" title="Move Down One Layer">
          <ArrowDown size={14} />
          <span className="text-[9px] font-medium mt-1">DOWN</span>
        </button>
        <button onClick={onMoveUp} disabled={isLocked} className="p-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex flex-col items-center justify-center text-xs" title="Move Up One Layer">
          <ArrowUp size={14} />
          <span className="text-[9px] font-medium mt-1">UP</span>
        </button>
        <button onClick={onMoveToFront} disabled={isLocked} className="p-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex flex-col items-center justify-center text-xs" title="Move to Front (Top Layer)">
          <ChevronsUp size={14} />
          <span className="text-[9px] font-medium mt-1">TO FRONT</span>
        </button>
      </div>
    </SectionContainer>
  );

  // 3. Text Style
  if (node.type === "Text") {
    panels.push(
      <SectionContainer key="text" title="Text Style" icon={Type}>
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
        <div className="space-y-2 w-fit mx-auto bg-gray-50 p-2 rounded-lg border border-gray-200">
          <div className="flex space-x-2 justify-center">
            <StyleButton icon={Bold} title="Bold" active={isBold} onClick={() => toggleFontStyle('bold')} />
            <StyleButton icon={Italic} title="Italic" active={isItalic} onClick={() => toggleFontStyle('italic')} />
            <StyleButton icon={Underline} title="Underline" active={isUnderline} onClick={() => toggleTextDecoration('underline')} />
          </div>
          <div className="w-full bg-gray-300 h-px"></div>
          <div className="flex space-x-2 justify-center">
            <StyleButton icon={AlignLeft} title="Align Left" active={align === 'left'} onClick={() => handlePropChange('align', 'left')} />
            <StyleButton icon={AlignCenter} title="Align Center" active={align === 'center'} onClick={() => handlePropChange('align', 'center')} />
            <StyleButton icon={AlignRight} title="Align Right" active={align === 'right'} onClick={() => handlePropChange('align', 'right')} />
            <StyleButton icon={AlignJustify} title="Justify" active={align === 'justify'} onClick={() => handlePropChange('align', 'justify')} />
          </div>
        </div>
        <div className="flex flex-col space-y-3 mb-4">
          <InputGroup label="Size" value={fontSize} min={6} onChange={(v) => handlePropChange('fontSize', Number(v))} />
          <ColorPickerWithSwatch label="Color" color={textColor} onChange={(v) => handlePropChange('fill', v)} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-700 mb-1">Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => handlePropChange('fontFamily', e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white"
            style={{ fontFamily: fontFamily }}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputGroup label="Line Height" unit="" type="number" value={lineHeight} step={0.1} min={0.5} onChange={(v) => handlePropChange('lineHeight', Number(v))} />
          <InputGroup label="Letter Spacing" unit="px" type="number" value={letterSpacing} step={0.1} onChange={(v) => handlePropChange('letterSpacing', Number(v))} />
        </div>
      </SectionContainer>
    );
  }

  // 4. Icon Appearance
  if (node.type === "Icon") {
    const iconProps = node.props as IconProps;
    const iconFill = iconProps.fill ?? '#000000';
    const iconStroke = iconProps.stroke ?? 'transparent';
    const iconStrokeWidth = iconProps.strokeWidth ?? 0;
    const iconWidth = iconProps.width ?? 60;
    const iconHeight = iconProps.height ?? 60;
    const iconName = iconProps.iconName || '';
    const isUniformSize = iconWidth === iconHeight;
    const isLucide = iconName.startsWith('lucide:') || !iconName.includes(':');

    panels.push(
      <SectionContainer key="icon-styling" title="Icon Appearance" icon={Type}>
        {isLucide ? (
          <>
            <ColorPickerWithSwatch label="Icon Color" color={iconStroke} onChange={(v) => handlePropChange('stroke', v)} />
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <ColorPickerWithSwatch label="Background" color={iconFill} onChange={(v) => handlePropChange('fill', v)} />
                <InputGroup label="Stroke Width" type="number" value={iconStrokeWidth} min={0} step={0.5} onChange={(v) => handlePropChange('strokeWidth', Number(v))} />
              </div>
            </div>
          </>
        ) : (
          <>
            <ColorPickerWithSwatch label="Icon Color" color={iconFill} onChange={(v) => handlePropChange('fill', v)} />
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <ColorPickerWithSwatch label="Border Color" color={iconStroke} onChange={(v) => handlePropChange('stroke', v)} />
                <InputGroup label="Border Width" type="number" value={iconStrokeWidth} min={0} step={0.5} onChange={(v) => handlePropChange('strokeWidth', Number(v))} />
              </div>
            </div>
          </>
        )}
        <div className="border-t border-gray-100 pt-3">
          <InputGroup
            label="Size (Uniform)"
            type="number"
            value={Math.round(isUniformSize ? iconWidth : Math.min(iconWidth, iconHeight))}
            min={1}
            onChange={(v) => {
              const newSize = Number(v);
              handlePropChange('width', newSize);
              handlePropChange('height', newSize);
            }}
            disabled={layoutControlsDisabled}
          />
          <p className="text-[10px] text-gray-500 mt-1">
            {isUniformSize ? '✓ Icon is square' : '⚠ Icon is not square - using smaller dimension'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <InputGroup label="Width" type="number" value={Math.round(iconWidth)} min={1} onChange={(v) => handlePropChange('width', Number(v))} disabled={layoutControlsDisabled} />
          <InputGroup label="Height" type="number" value={Math.round(iconHeight)} min={1} onChange={(v) => handlePropChange('height', Number(v))} disabled={layoutControlsDisabled} />
        </div>
      </SectionContainer>
    );
  }

  // 5. Image Adjustments (Filters & Flip)
  if (node.type === "Image") {
    const imageProps = node.props as ImageProps;
    const filters = imageProps.filters || {};
    const flipHorizontal = imageProps.flipHorizontal || false;
    const flipVertical = imageProps.flipVertical || false;

    panels.push(
      <SectionContainer key="image-adjustments" title="Image Adjustments" icon={Settings}>
        {/* Flip Controls */}
        <div className="flex flex-col mb-4">
          <label className="text-xs font-semibold text-gray-700 mb-2">Flip</label>
          <div className="flex gap-2">
            <button
              onClick={() => handlePropChange('flipHorizontal', !flipHorizontal)}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium border transition-colors ${flipHorizontal ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Flip Horizontal
            </button>
            <button
              onClick={() => handlePropChange('flipVertical', !flipVertical)}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium border transition-colors ${flipVertical ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Flip Vertical
            </button>
          </div>
        </div>

        {/* Filter Sliders */}
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <InputGroup
            label="Brightness"
            type="range"
            min={0} max={200}
            value={filters.brightness ?? 100}
            onChange={(v) => handlePropChange('filters', { ...filters, brightness: Number(v) })}
          />
          <InputGroup
            label="Contrast"
            type="range"
            min={0} max={200}
            value={filters.contrast ?? 100}
            onChange={(v) => handlePropChange('filters', { ...filters, contrast: Number(v) })}
          />
          <InputGroup
            label="Saturation"
            type="range"
            min={0} max={200}
            value={filters.saturate ?? 100}
            onChange={(v) => handlePropChange('filters', { ...filters, saturate: Number(v) })}
          />
          <InputGroup
            label="Blur"
            type="range"
            min={0} max={20}
            value={filters.blur ?? 0}
            onChange={(v) => handlePropChange('filters', { ...filters, blur: Number(v) })}
          />
          <InputGroup
            label="Grayscale"
            type="range"
            min={0} max={100}
            value={filters.grayscale ?? 0}
            onChange={(v) => handlePropChange('filters', { ...filters, grayscale: Number(v) })}
          />
        </div>
      </SectionContainer>
    );
  }

  // 6. Generic Appearance (Fill, Stroke, Corner Radius, Crop)
  const capabilities = getNodeCapabilities(node);

  if (capabilities.hasFill || capabilities.hasStroke || capabilities.hasCrop) {
    panels.push(
      <SectionContainer key="shape" title={node.type.includes("Image") ? "Image Settings" : "Appearance"} icon={Layout}>
        {/* Crop Button for Images */}
        {capabilities.hasCrop && (
          <div className="mb-4">
            <button
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium"
              onClick={() => {
                if (onEnterCropMode) {
                  onEnterCropMode();
                } else {
                  // Fallback if prop not provided yet
                  alert("Double-click the image on canvas to crop.");
                }
              }}
            >
              <Crop size={16} />
              <span>Enter Crop Mode</span>
            </button>
          </div>
        )}

        {capabilities.hasFill && node.type !== "Icon" && node.type !== "Text" && (
          <div className="mb-3">
            <ColorPickerWithSwatch label="Fill Color" color={fill} onChange={(v) => handlePropChange('fill', v)} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-2">
          {node.type === "Rect" || node.type === "Image" ? (
            <InputGroup label="Corner Radius" value={cornerRadius} min={0} onChange={(v) => handlePropChange('cornerRadius', Number(v))} />
          ) : (
            <div />
          )}
        </div>

        {capabilities.hasStroke && node.type !== "Icon" && (
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <ColorPickerWithSwatch label={node.type === "Image" ? "Border Color" : "Stroke Color"} color={stroke || "#000000"} onChange={(v) => handlePropChange('stroke', v)} />
            <InputGroup label={node.type === "Image" ? "Border Width" : "Stroke Width"} value={strokeWidth} min={0} onChange={(v) => handlePropChange('strokeWidth', Number(v))} />
          </div>
        )}
      </SectionContainer>
    );
  }

  // 7. Transform
  // For Path shapes, get scaleX/scaleY (they're the source of truth)
  const pathScaleX = node.type === 'Path' ? ((node.props as any).scaleX || 1) : 1;
  const pathScaleY = node.type === 'Path' ? ((node.props as any).scaleY || 1) : 1;

  // Use average scale for display (they should be equal for aspect ratio lock)
  const currentScale = node.type === 'Path' ? pathScaleX : 1;

  // Handle scale change for Path shapes
  const handleScaleChange = (newScale: number) => {
    if (node.type === 'Path') {
      // Update both scaleX and scaleY to maintain aspect ratio
      onPropChange(id, { scaleX: newScale, scaleY: newScale });
    }
  };

  panels.push(
    <SectionContainer key="transform" title="Transform" icon={Move} disabled={layoutControlsDisabled}>
      <div className="grid grid-cols-2 gap-3">
        <InputGroup label="X" value={Math.round(x)} step={1} onChange={(v) => handlePropChange('x', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Y" value={Math.round(y)} step={1} onChange={(v) => handlePropChange('y', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Rotation" unit="°" value={Math.round(rotation)} step={1} onChange={(v) => handlePropChange('rotation', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Opacity" unit="%" type="number" value={Math.round(opacity)} min={0} max={100} onChange={(v) => handlePropChange('opacity', Number(v))} disabled={layoutControlsDisabled} />
      </div>

      {/* Scale slider for Path shapes */}
      {node.type === 'Path' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Scale</span>
            <span className="text-xs text-gray-500">{(currentScale * 100).toFixed(0)}%</span>
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.01"
              value={currentScale}
              onChange={(e) => handleScaleChange(Number(e.target.value))}
              disabled={layoutControlsDisabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex items-center gap-2">
              <InputGroup
                label="Precise"
                value={currentScale.toFixed(2)}
                min={0.1}
                max={3}
                step={0.01}
                type="number"
                onChange={(v) => handleScaleChange(Number(v))}
                disabled={layoutControlsDisabled}
              />
            </div>
          </div>
        </div>
      )}

      {/* Regular Width/Height for other shapes */}
      {node.type !== 'Path' && (
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
          <InputGroup label="Width" value={Math.round(width)} min={1} step={1} onChange={(v) => handlePropChange('width', Number(v))} disabled={layoutControlsDisabled} />
          <InputGroup label="Height" value={Math.round(height)} min={1} step={1} onChange={(v) => handlePropChange('height', Number(v))} disabled={layoutControlsDisabled} />
        </div>
      )}
    </SectionContainer>
  );

  // 8. Shadow
  panels.push(
    <SectionContainer key="shadow" title="Shadow" icon={RotateCw} defaultOpen={false}>
      <ColorPickerWithSwatch label="Shadow Color" color={shadowColor || "#000000"} onChange={(v) => handlePropChange('shadowColor', v)} />
      <InputGroup label="Blur" value={shadowBlur} min={0} step={1} onChange={(v) => handlePropChange('shadowBlur', Number(v))} />
      <div className="grid grid-cols-2 gap-3">
        <InputGroup label="Offset X" value={shadowOffsetX} onChange={(v) => handlePropChange('shadowOffsetX', Number(v))} />
        <InputGroup label="Offset Y" value={shadowOffsetY} onChange={(v) => handlePropChange('shadowOffsetY', Number(v))} />
      </div>
    </SectionContainer>
  );

  return (
    <div className="property-panel w-80 border-l bg-white flex flex-col h-full shadow-lg z-10">
      <div className="px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 flex items-center justify-between">
        <h2 className="font-bold text-base text-gray-800 tracking-tight">
          {node.type} Properties
        </h2>
      </div>
      <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1 pb-20">
        {panels}
      </div>
    </div>
  );
}

// Missing icons import fix
function Edit({ size, className }: { size: number, className?: string }) {
  return <Type size={size} className={className} />; // Placeholder if Edit icon is missing or use Lucide's Edit
}