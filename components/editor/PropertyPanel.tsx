// components/editor/PropertyPanel.tsx

"use client";

import {
  KonvaNodeDefinition,
  KonvaNodeProps,
  TextProps,
  RectProps,
  ImageProps,
  CircleProps,
  EllipseProps,
  StarProps,
  RegularPolygonProps,
  LineProps,
  ArrowProps,
  PathProps,
  IconProps,
  FontName
} from "@/types/template";
import React, { useCallback } from "react";
import ColorPicker from "./ColorPicker";
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Underline, Bold,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Lock, Unlock,
  Eye, EyeOff, Edit, Move, RotateCw, Settings, Layout, Layers
} from "lucide-react";

// --- FONT OPTIONS LIST ---
const FONT_OPTIONS: FontName[] = [
  "Arial", "Verdana", "Helvetica", "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "sans-serif",
  "Times New Roman", "Georgia", "Palatino", "serif", "Playfair Display", "Merriweather",
  "Courier New", "Lucida Console", "monospace",
  "Garamond", "Impact", "Comic Sans MS", "Pacifico", "Bebas Neue",
];

type EditorMode = "FULL_EDIT" | "DATA_ONLY";

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
        className={`w-full border border-gray-300 p-2 pr-8 rounded-md text-sm transition-all focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}`}
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

interface CustomColorPickerProps {
  label?: string;
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

const ColorPickerWithSwatch: React.FC<CustomColorPickerProps> = ({ label, color, onChange, disabled = false, showLabel = true }) => (
  <div className="flex flex-col">
    {showLabel && label && (
      <label className="text-xs font-semibold text-gray-700 mb-1">{label}</label>
    )}
    <ColorPicker
      color={color}
      onChange={onChange}
      disabled={disabled}
    />
  </div>
);

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

interface PropertyPanelProps {
  node: KonvaNodeDefinition | null;
  onPropChange: (updates: Partial<KonvaNodeProps>) => void;
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

  type AllKonvaPropKeys = keyof TextProps | keyof RectProps | keyof ImageProps | keyof CircleProps | keyof EllipseProps | keyof StarProps | keyof RegularPolygonProps | keyof LineProps | keyof ArrowProps | keyof PathProps | keyof IconProps;

  const handlePropChange = useCallback((key: string, value: any) => {
    let finalValue = value;
    if (typeof finalValue === 'number' && isNaN(finalValue)) {
      return;
    }
    if (key === 'opacity' && typeof finalValue === 'number') {
      finalValue = finalValue / 100;
    }
    onPropChange({ [key as AllKonvaPropKeys]: finalValue } as Partial<KonvaNodeProps>);
  }, [onPropChange]);

  const handleDefinitionChange = useCallback((key: 'locked' | 'editable' | 'visible', value: boolean) => {
    onDefinitionChange({ [key]: value } as Partial<KonvaNodeDefinition & { visible: boolean }>);
  }, [onDefinitionChange]);

  const handleToggleLock = useCallback(() => {
    handleDefinitionChange('locked', !node?.locked);
  }, [handleDefinitionChange, node]);

  if (!node) {
    return (
      <div className="property-panel w-80 border-l bg-white p-6 shrink-0 overflow-y-auto space-y-6 h-full shadow-lg z-10">
        <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
          <Settings size={24} className="mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">
            Select an element on the canvas to view and edit its properties.
          </p>
        </div>
      </div>
    );
  }

  const props = node.props;
  const isVisible = (node as any).visible ?? true;

  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const width = props.width ?? 0;
  const height = props.height ?? 0;
  const rotation = props.rotation ?? 0;
  const opacity = (props.opacity ?? 1) * 100;
  const shadowColor = props.shadowColor ?? "#000000";
  const shadowBlur = props.shadowBlur ?? 0;
  const shadowOffsetX = props.shadowOffsetX ?? 0;
  const shadowOffsetY = props.shadowOffsetY ?? 0;

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

  let fill = "#000000";
  let stroke = "#000000";
  let strokeWidth = 0;
  let cornerRadius = 0;

  if (node.type === "Text") {
    const textProps = node.props as TextProps;
    text = textProps.text ?? text;
    fontSize = textProps.fontSize ?? fontSize;
    fontFamily = (textProps.fontFamily ?? fontFamily) as FontName;
    align = textProps.align ?? align;
    lineHeight = textProps.lineHeight ?? lineHeight;
    letterSpacing = textProps.letterSpacing ?? letterSpacing;
    textColor = textProps.fill ?? textColor;
    textDecoration = textProps.textDecoration ?? textDecoration;
    fontStyle = textProps.fontStyle ?? fontStyle;
    isBold = fontStyle?.includes('bold') || false;
    isItalic = fontStyle?.includes('italic') || false;
    isUnderline = textDecoration?.includes('underline') || false;
  } else if (["Rect", "Circle", "Ellipse", "Star", "RegularPolygon", "Path"].includes(node.type)) {
    const shapeProps = node.props as RectProps | CircleProps | EllipseProps | StarProps | RegularPolygonProps | PathProps;
    fill = shapeProps.fill ?? fill;
    stroke = shapeProps.stroke ?? stroke;
    strokeWidth = shapeProps.strokeWidth ?? strokeWidth;
    if (node.type === "Rect") {
      cornerRadius = (shapeProps as RectProps).cornerRadius ?? cornerRadius;
    }
  } else if (["Image", "Line", "Arrow"].includes(node.type)) {
    const lineProps = node.props as ImageProps | LineProps | ArrowProps;
    stroke = lineProps.stroke ?? stroke;
    strokeWidth = lineProps.strokeWidth ?? strokeWidth;
    if (node.type === "Image") {
      cornerRadius = (lineProps as ImageProps).cornerRadius ?? cornerRadius;
    }
  }

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

  const panels = [];

  panels.push(
    <div key="config" className="space-y-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuration</h3>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleToggleLock}
          className={`p-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 ${isLocked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
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
      </div>
    </div>
  );

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
            <StyleButton icon={Type} title="Italic" active={isItalic} onClick={() => toggleFontStyle('italic')} />
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

  if (["Rect", "Circle", "Ellipse", "Star", "RegularPolygon", "Path", "Image", "Line", "Arrow"].includes(node.type)) {
    panels.push(
      <SectionContainer key="shape" title={node.type.includes("Image") ? "Border/Fill" : "Appearance"} icon={Layout}>
        {["Rect", "Circle", "Ellipse", "Star", "RegularPolygon", "Path", "Image"].includes(node.type) && (
          <div className="grid grid-cols-2 gap-3 pb-2">
            {node.type !== "Image" ? (
              <ColorPickerWithSwatch label="Fill Color" color={fill} onChange={(v) => handlePropChange('fill', v)} />
            ) : (
              <div />
            )}
            {node.type === "Rect" || node.type === "Image" ? (
              <InputGroup label="Corner Radius" value={cornerRadius} min={0} onChange={(v) => handlePropChange('cornerRadius', Number(v))} />
            ) : (
              <div />
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <ColorPickerWithSwatch label={node.type === "Image" ? "Border Color" : "Stroke Color"} color={stroke || "#000000"} onChange={(v) => handlePropChange('stroke', v)} />
          <InputGroup label={node.type === "Image" ? "Border Width" : "Stroke Width"} value={strokeWidth} min={0} onChange={(v) => handlePropChange('strokeWidth', Number(v))} />
        </div>
      </SectionContainer>
    );
  }

  panels.push(
    <SectionContainer key="transform" title="Transform" icon={Move} disabled={layoutControlsDisabled}>
      <div className="grid grid-cols-2 gap-3">
        <InputGroup label="X" value={Math.round(x)} step={1} onChange={(v) => handlePropChange('x', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Y" value={Math.round(y)} step={1} onChange={(v) => handlePropChange('y', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Rotation" unit="°" value={Math.round(rotation)} step={1} onChange={(v) => handlePropChange('rotation', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Opacity" unit="%" type="number" value={Math.round(opacity)} min={0} max={100} onChange={(v) => handlePropChange('opacity', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Width" value={Math.round(width)} min={1} step={1} onChange={(v) => handlePropChange('width', Number(v))} disabled={layoutControlsDisabled} />
        <InputGroup label="Height" value={Math.round(height)} min={1} step={1} onChange={(v) => handlePropChange('height', Number(v))} disabled={layoutControlsDisabled} />
      </div>
    </SectionContainer>
  );

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