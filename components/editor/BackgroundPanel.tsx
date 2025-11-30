'use client';

import React from 'react';
import { BackgroundPattern, BackgroundType } from '@/types/template';
import { GRADIENT_PRESETS, PATTERN_PRESETS, SOLID_PRESETS, TEXTURE_PRESETS, PATTERN_GENERATORS } from '@/lib/backgroundPatterns';
import { Check, Plus, Trash2 } from 'lucide-react';

interface BackgroundPanelProps {
  currentBackground: BackgroundPattern;
  onBackgroundChange: (updates: Partial<BackgroundPattern>) => void;
}

const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ currentBackground, onBackgroundChange }) => {

  const handleTypeChange = (type: BackgroundType) => {
    const defaults: Partial<BackgroundPattern> = {
      type,
      opacity: 1,
      rotation: 0,
      scale: 1,
      blur: 0,
    };

    if (type === 'solid') {
      defaults.color1 = '#FFFFFF';
    } else if (type === 'gradient') {
      defaults.color1 = '#F59E0B';
      defaults.color2 = '#EF4444';
      defaults.gradientType = 'linear';
      defaults.gradientStops = [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: '#EF4444' }];
    } else if (type === 'pattern') {
      defaults.patternImageURL = PATTERN_PRESETS[0].pattern.patternImageURL;
      defaults.patternId = PATTERN_PRESETS[0].pattern.patternId;
      defaults.patternColor = PATTERN_PRESETS[0].pattern.patternColor;
      defaults.color1 = '#ffffff';
    } else if (type === 'texture') {
      defaults.patternImageURL = TEXTURE_PRESETS[0].pattern.patternImageURL;
      defaults.color1 = '#ffffff';
      defaults.overlayColor = '#000000';
      defaults.opacity = 0.5;
    }

    onBackgroundChange(defaults);
  };

  // Helper to regenerate pattern URL when color changes
  const updatePatternColor = (newColor: string) => {
    if (currentBackground.type === 'pattern' && currentBackground.patternId) {
      const generator = PATTERN_GENERATORS[currentBackground.patternId as keyof typeof PATTERN_GENERATORS];
      if (generator) {
        const newUrl = generator(newColor);
        onBackgroundChange({
          patternColor: newColor,
          patternImageURL: newUrl
        });
      }
    }
  };

  const renderPreview = (preset: { id: string, name: string, pattern: BackgroundPattern }, idx: number) => {
    const bg = preset.pattern;
    let backgroundStyle = '';

    if (bg.type === 'gradient') {
      const stops = bg.gradientStops
        ? bg.gradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')
        : `${bg.color1}, ${bg.color2}`;
      backgroundStyle = bg.gradientType === 'radial'
        ? `radial-gradient(circle, ${stops})`
        : `linear-gradient(${bg.rotation || 45}deg, ${stops})`;
    } else if (bg.type === 'pattern' || bg.type === 'texture') {
      backgroundStyle = `url('${bg.patternImageURL}') repeat`;
    } else {
      backgroundStyle = bg.color1;
    }

    const isActive = currentBackground.type === bg.type && (
      bg.type === 'solid' ? currentBackground.color1 === bg.color1 :
        bg.type === 'gradient' ? (currentBackground.color1 === bg.color1 && currentBackground.color2 === bg.color2) : // Heuristic check
          bg.patternImageURL === currentBackground.patternImageURL
    );

    return (
      <button
        key={`${preset.id}-${idx}`}
        onClick={() => onBackgroundChange({ ...bg })}
        className={`
            relative w-full aspect-square rounded-lg border-2 transition-all overflow-hidden
            ${isActive ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
        `}
        title={preset.name}
      >
        <div className="w-full h-full" style={{ background: backgroundStyle, backgroundColor: bg.color1, backgroundSize: bg.type === 'pattern' ? '50%' : 'cover' }} />
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <Check size={18} className="text-white drop-shadow-md" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <div className="space-y-6 text-gray-900 overflow-y-auto custom-scrollbar flex-1 p-5 pb-20">

        {/* Type Selector */}
        <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200">
          {['solid', 'gradient', 'pattern', 'texture'].map(type => (
            <button
              key={type}
              onClick={() => handleTypeChange(type as BackgroundType)}
              className={`
                    flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all
                    ${currentBackground.type === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                  `}
            >
              {type}
            </button>
          ))}
        </div>

        {/* SOLID */}
        {currentBackground.type === 'solid' && (
          <div className="space-y-4">
            <PresetGrid title="Solid Colors">
              {SOLID_PRESETS.map((preset, idx) => renderPreview(preset, idx))}
            </PresetGrid>
            <div className="pt-2">
              <ColorPickerInput
                label="Custom Color"
                value={currentBackground.color1}
                onChange={(v) => onBackgroundChange({ color1: v })}
              />
            </div>
          </div>
        )}

        {/* GRADIENT */}
        {currentBackground.type === 'gradient' && (
          <div className="space-y-4">
            <PresetGrid title="Gradient Presets">
              {GRADIENT_PRESETS.map((preset, idx) => renderPreview(preset, idx))}
            </PresetGrid>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <SectionHeader title="Customize Gradient" />

              <div className="flex space-x-2">
                <button
                  onClick={() => onBackgroundChange({ gradientType: 'linear' })}
                  className={`flex-1 py-1 text-xs border rounded ${currentBackground.gradientType === 'linear' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50'}`}
                >Linear</button>
                <button
                  onClick={() => onBackgroundChange({ gradientType: 'radial' })}
                  className={`flex-1 py-1 text-xs border rounded ${currentBackground.gradientType === 'radial' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50'}`}
                >Radial</button>
              </div>

              {currentBackground.gradientType === 'linear' && (
                <RangeInput
                  label="Angle"
                  value={currentBackground.rotation || 0}
                  min={0} max={360} step={15} unit="°"
                  onChange={(v) => onBackgroundChange({ rotation: v })}
                />
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-700">Color Stops</span>
                  <button
                    onClick={() => {
                      // FIX: Ensure stops exist, or initialize from current colors
                      const stops = currentBackground.gradientStops && currentBackground.gradientStops.length > 0
                        ? [...currentBackground.gradientStops]
                        : [
                          { offset: 0, color: currentBackground.color1 || '#000000' },
                          { offset: 1, color: currentBackground.color2 || '#ffffff' }
                        ];

                      if (stops.length < 5) {
                        // Add new stop halfway between last stop and 1, or just at 0.5 if simple
                        stops.push({ offset: 0.5, color: '#ffffff' });
                        // Sort stops by offset to keep UI sane
                        stops.sort((a, b) => a.offset - b.offset);
                        onBackgroundChange({ gradientStops: stops });
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Plus size={12} className="mr-1" /> Add
                  </button>
                </div>
                {/* Ensure we render stops if they exist, or fallback to 2 inputs for color1/color2 if not (legacy support) */}
                {(currentBackground.gradientStops || [{ offset: 0, color: currentBackground.color1 }, { offset: 1, color: currentBackground.color2 }]).map((stop, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => {
                        const newStops = currentBackground.gradientStops
                          ? [...currentBackground.gradientStops]
                          : [{ offset: 0, color: currentBackground.color1 || '#000000' }, { offset: 1, color: currentBackground.color2 || '#ffffff' }];

                        newStops[idx].color = e.target.value;

                        // Also update legacy fields for backward compat if it's the first/last stop
                        const updates: any = { gradientStops: newStops };
                        if (idx === 0) updates.color1 = e.target.value;
                        if (idx === newStops.length - 1) updates.color2 = e.target.value;

                        onBackgroundChange(updates);
                      }}
                      className="w-6 h-6 rounded cursor-pointer border-none p-0"
                    />
                    <input
                      type="range"
                      min={0} max={1} step={0.01}
                      value={stop.offset}
                      onChange={(e) => {
                        const newStops = currentBackground.gradientStops
                          ? [...currentBackground.gradientStops]
                          : [{ offset: 0, color: currentBackground.color1 || '#000000' }, { offset: 1, color: currentBackground.color2 || '#ffffff' }];

                        newStops[idx].offset = parseFloat(e.target.value);
                        // Sort? Maybe better not to auto-sort while dragging
                        onBackgroundChange({ gradientStops: newStops });
                      }}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    {(currentBackground.gradientStops && currentBackground.gradientStops.length > 2) && (
                      <button
                        onClick={() => {
                          const newStops = currentBackground.gradientStops?.filter((_, i) => i !== idx);
                          onBackgroundChange({ gradientStops: newStops });
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PATTERN */}
        {currentBackground.type === 'pattern' && (
          <div className="space-y-4">
            <PresetGrid title="Pattern Styles">
              {PATTERN_PRESETS.map((preset, idx) => renderPreview(preset, idx))}
            </PresetGrid>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <SectionHeader title="Customize Pattern" />
              <ColorPickerInput
                label="Background Color"
                value={currentBackground.color1}
                onChange={(v) => onBackgroundChange({ color1: v })}
              />
              {/* NEW: Pattern Color Picker */}
              <ColorPickerInput
                label="Pattern Color"
                value={currentBackground.patternColor || '#9C92AC'}
                onChange={(v) => updatePatternColor(v)}
              />
              <RangeInput
                label="Scale"
                value={currentBackground.scale || 1}
                min={0.1} max={3} step={0.1}
                onChange={(v) => onBackgroundChange({ scale: v })}
              />
              <RangeInput
                label="Opacity"
                value={currentBackground.opacity || 1}
                min={0} max={1} step={0.05}
                onChange={(v) => onBackgroundChange({ opacity: v })}
              />
              <RangeInput
                label="Rotation"
                value={currentBackground.rotation || 0}
                min={0} max={360} step={15} unit="°"
                onChange={(v) => onBackgroundChange({ rotation: v })}
              />
            </div>
          </div>
        )}

        {/* TEXTURE */}
        {currentBackground.type === 'texture' && (
          <div className="space-y-4">
            <PresetGrid title="Texture Overlays">
              {TEXTURE_PRESETS.map((preset, idx) => renderPreview(preset, idx))}
            </PresetGrid>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <SectionHeader title="Customize Texture" />
              <ColorPickerInput
                label="Base Color"
                value={currentBackground.color1}
                onChange={(v) => onBackgroundChange({ color1: v })}
              />
              <ColorPickerInput
                label="Overlay Tint"
                value={currentBackground.overlayColor || '#000000'}
                onChange={(v) => onBackgroundChange({ overlayColor: v })}
              />
              <RangeInput
                label="Intensity (Opacity)"
                value={currentBackground.opacity || 0.5}
                min={0} max={1} step={0.05}
                onChange={(v) => onBackgroundChange({ opacity: v })}
              />
              <RangeInput
                label="Scale"
                value={currentBackground.scale || 1}
                min={0.1} max={3} step={0.1}
                onChange={(v) => onBackgroundChange({ scale: v })}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- Helper Components ---

const SectionHeader = ({ title }: { title: string }) => (
  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">{title}</h4>
);

const PresetGrid = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-3">
    <SectionHeader title={title} />
    <div className="grid grid-cols-4 gap-3">
      {children}
    </div>
  </div>
);

const ColorPickerInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="flex flex-col space-y-2">
    <span className="text-xs font-semibold text-gray-700">{label}</span>
    <div className="flex items-center space-x-3 bg-white p-2 rounded-md border border-gray-300 shadow-sm">
      <div className="w-10 h-10 rounded-md border border-gray-200 overflow-hidden relative flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 cursor-pointer border-none"
        />
      </div>
      <div className="flex-1">
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            if (/^#[0-9A-F]{0,6}$/i.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="w-full text-xs font-mono text-gray-600 border-none focus:ring-0 p-0"
          placeholder="#000000"
        />
      </div>
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
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{Math.round(value * 100) / 100}{unit}</span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    />
  </div>
);

export default BackgroundPanel;