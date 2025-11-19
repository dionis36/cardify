'use client';

import React from 'react';
import { BackgroundPattern, BackgroundType } from '@/types/template';
import { GRADIENT_PRESETS, PATTERN_PRESETS, SOLID_PRESETS } from '@/lib/backgroundPatterns';
import { Check, ChevronRight } from 'lucide-react';

interface BackgroundPanelProps {
  currentBackground: BackgroundPattern;
  onBackgroundChange: (updates: Partial<BackgroundPattern>) => void;
}

const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ currentBackground, onBackgroundChange }) => {
  
  const handleTypeChange = (type: BackgroundType) => {
    // When switching types, we set a sensible default to avoid broken states
    const defaults: Partial<BackgroundPattern> = {
      type,
      opacity: 1,
      rotation: 0,
      scale: 1
    };

    // Reset colors based on type to ensure they aren't carrying over weirdly
    if (type === 'solid') {
      defaults.color1 = '#FFFFFF';
    } else if (type === 'gradient') {
      defaults.color1 = '#F59E0B';
      defaults.color2 = '#EF4444';
    } else if (type === 'pattern') {
      // Default to the first pattern if switching to pattern mode
      defaults.patternImageURL = PATTERN_PRESETS[0].pattern.patternImageURL;
      defaults.color1 = '#ffffff';
    }

    onBackgroundChange(defaults);
  };
  
  const renderPatternPreview = (preset: { id: string, pattern: BackgroundPattern }, idx: number) => {
    const bg = preset.pattern;
    // Calculate preview style
    const style: React.CSSProperties = {
        background: bg.type === 'gradient' 
          ? `linear-gradient(${bg.rotation || 45}deg, ${bg.color1}, ${bg.color2})` 
          : bg.type === 'pattern' 
          ? `url('${bg.patternImageURL}') repeat`
          : bg.color1,
        backgroundSize: bg.type === 'pattern' ? '50%' : 'cover',
        backgroundColor: bg.color1, // Fallback/Base for patterns
    };

    // Check if this preset effectively matches current state
    const isActive = 
        (currentBackground.type === bg.type) && 
        (currentBackground.type === 'pattern' ? currentBackground.patternImageURL === bg.patternImageURL : 
         currentBackground.type === 'gradient' ? (currentBackground.color1 === bg.color1 && currentBackground.color2 === bg.color2) :
         currentBackground.color1 === bg.color1);

    return (
      <button 
        key={`${preset.id}-${idx}`}
        onClick={() => onBackgroundChange({ ...bg })} 
        className={`
            relative w-full aspect-square rounded-lg border transition-all overflow-hidden
            ${isActive ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-600 hover:border-gray-400'}
        `}
        title={preset.id}
      >
        <div className="w-full h-full" style={style} />
        {isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Check size={16} className="text-white drop-shadow-md" />
            </div>
        )}
      </button>
    );
  };

  return (
    <div className="p-4 space-y-6 text-gray-200 overflow-y-auto custom-scrollbar h-full pb-20">
      
      {/* 1. Type Selector */}
      <div className="flex p-1 bg-gray-800 rounded-lg border border-gray-700">
          {['solid', 'gradient', 'pattern'].map(type => (
              <button 
                  key={type} 
                  onClick={() => handleTypeChange(type as BackgroundType)}
                  className={`
                    flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all
                    ${currentBackground.type === type ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}
                  `}
              >
                  {type}
              </button>
          ))}
      </div>

      {/* 2. Dynamic Content Based on Type */}
      
      {/* SOLID COLOR MODE */}
      {currentBackground.type === 'solid' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Solid Colors</h4>
            <div className="grid grid-cols-5 gap-2">
                {SOLID_PRESETS.map((preset, idx) => renderPatternPreview(preset, idx))}
            </div>
            
            <div className="pt-2">
                <ColorPickerInput 
                    label="Custom Color" 
                    value={currentBackground.color1} 
                    onChange={(v) => onBackgroundChange({ color1: v })} 
                />
            </div>
          </div>
      )}

      {/* GRADIENT MODE */}
      {currentBackground.type === 'gradient' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gradient Presets</h4>
            <div className="grid grid-cols-4 gap-3">
                {GRADIENT_PRESETS.map((preset, idx) => renderPatternPreview(preset, idx))}
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customize Gradient</h4>
                <ColorPickerInput 
                    label="Start Color" 
                    value={currentBackground.color1} 
                    onChange={(v) => onBackgroundChange({ color1: v })} 
                />
                <ColorPickerInput 
                    label="End Color" 
                    value={currentBackground.color2 || '#ffffff'} 
                    onChange={(v) => onBackgroundChange({ color2: v })} 
                />
                <RangeInput 
                    label="Angle" 
                    value={currentBackground.rotation || 0} 
                    min={0} max={360} step={15} unit="°"
                    onChange={(v: number) => onBackgroundChange({ rotation: v })} 
                />
            </div>
          </div>
      )}

      {/* PATTERN MODE */}
      {currentBackground.type === 'pattern' && (
          <div className="space-y-4">
             <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pattern Styles</h4>
             <div className="grid grid-cols-4 gap-3">
                {PATTERN_PRESETS.map((preset, idx) => renderPatternPreview(preset, idx))}
             </div>

             <div className="border-t border-gray-700 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customize Pattern</h4>
                <ColorPickerInput 
                    label="Base Color" 
                    value={currentBackground.color1} 
                    onChange={(v) => onBackgroundChange({ color1: v })} 
                />
                <RangeInput 
                    label="Scale" 
                    value={currentBackground.scale || 1} 
                    min={0.1} max={3} step={0.1}
                    onChange={(v: number) => onBackgroundChange({ scale: v })} 
                />
                 <RangeInput 
                    label="Opacity" 
                    value={currentBackground.opacity || 1} 
                    min={0} max={1} step={0.05}
                    onChange={(v: number) => onBackgroundChange({ opacity: v })} 
                />
             </div>
          </div>
      )}
    </div>
  );
};

// --- Internal Helper Components (To ensure self-contained logic) ---

const ColorPickerInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700">
        <span className="text-xs text-gray-300">{label}</span>
        <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded border border-gray-600 overflow-hidden relative">
                <input 
                    type="color" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 cursor-pointer border-none"
                />
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase">{value}</span>
        </div>
    </div>
);

interface RangeInputProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    unit?: string;
}

const RangeInput = ({ label, value, min, max, step, onChange, unit = '' }: RangeInputProps) => (
    <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
            <span>{label}</span>
            <span>{Math.round(value * 100) / 100}{unit}</span>
        </div>
        <input 
            type="range" 
            min={min} max={max} step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
    </div>
);

export default BackgroundPanel;