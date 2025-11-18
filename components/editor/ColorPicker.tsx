// components/editor/ColorPicker.tsx

"use client";

import React from "react";

interface ColorPickerProps {
  label?: string; // This is optional
  color: string;
  onChange: (newColor: string) => void;
  disabled?: boolean;
  className?: string; // Note: 'className' is not used in the return JSX but is in the interface
}

/**
 * A simple Color Picker component that can be easily upgraded in Phase 2.4
 * to integrate a library like 'react-colorful' or brand palettes.
 */
const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, disabled }) => {
  return (
    <div className="space-y-1">
      {/* FIX: Conditionally render the label element. 
        If 'label' is undefined or an empty string, this element will not be rendered.
      */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className={`flex items-center space-x-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {/* Color Swatch / Native Input */}
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 p-0 border-none rounded-md overflow-hidden cursor-pointer"
          disabled={disabled}
          title="Select Color"
        />
        {/* Hex Input - IMPORTANT: Padding changed from p-1 to p-2 for vertical alignment with other inputs */}
        <input
          type="text"
          value={color}
          onChange={(e) => {
            // Basic validation to ensure it's a valid color format before calling onChange
            if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value) || e.target.value.length === 7) {
              onChange(e.target.value.toUpperCase());
            } else {
                // Allows user to type without immediate error, but keeps component controlled
                onChange(e.target.value);
            }
          }}
          className="flex-1 border p-2 rounded text-sm font-mono focus:ring-blue-500 focus:border-blue-500 bg-white uppercase"
          maxLength={7}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ColorPicker;