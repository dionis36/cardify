'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import {
  ICON_DEFINITIONS,
  IconDefinition,
  IconCategory,
  getDefaultIconProps
} from '@/lib/icon-data';
import { KonvaNodeDefinition, IconProps } from '@/types/template';

interface IconLibraryProps {
  onAddLayer: (layer: KonvaNodeDefinition) => void;
}

const CATEGORIES: ('All' | IconCategory)[] = [
  'All',
  'Essentials',
  'Business',
  'Social',
  'Tech',
  'Arrows',
  'Layout',
  'Nature'
];

const IconLibrary: React.FC<IconLibraryProps> = ({ onAddLayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<IconCategory | 'All'>('All');

  // --- Filtering Logic ---
  const filteredIcons = useMemo(() => {
    let icons = ICON_DEFINITIONS;

    // 1. Filter by Category
    if (activeCategory !== 'All') {
      icons = icons.filter(icon => icon.category === activeCategory);
    }

    // 2. Filter by Search Term (Name or Tags)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase().trim();
      icons = icons.filter(icon =>
        icon.name.toLowerCase().includes(lowerSearch) ||
        icon.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
      );
    }
    return icons;
  }, [searchTerm, activeCategory]);

  // --- Action to add the icon layer ---
  const handleAddIcon = useCallback((iconDef: IconDefinition) => {
    const timestamp = Date.now();
    const id = `icon_${timestamp}`;

    // Get default props from our library helper
    const defaultProps = getDefaultIconProps(iconDef.name);

    const newIconLayer: KonvaNodeDefinition = {
      id,
      type: 'Icon', // Strictly typed to match types/template.ts
      props: {
        id,
        ...defaultProps,
        // Ensure mandatory props are present if partial
        iconName: iconDef.name, // FIXED: Changed from 'name' to 'iconName' to match IconProps
      } as IconProps,
      editable: true,
      locked: false,
    };

    onAddLayer(newIconLayer);
  }, [onAddLayer]);

  return (
    <div className="flex flex-col h-full p-4 space-y-4">

      {/* 1. Search Bar */}
      <div className="relative shrink-0">
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 text-gray-900 p-2.5 pl-9 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 placeholder-gray-400 shadow-sm"
        />
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* 2. Category Tabs (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 custom-scrollbar">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all
                ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-gray-200'}
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3. Icon Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="grid grid-cols-3 gap-3 pb-20">
          {filteredIcons.map((iconDef) => (
            <button
              key={iconDef.name}
              onClick={() => handleAddIcon(iconDef)}
              className="
                group flex flex-col items-center justify-center 
                p-3 h-24 rounded-lg
                bg-white border border-gray-200 
                hover:bg-gray-50 hover:border-gray-300 hover:shadow-md
                transition-all duration-200
              "
              title={iconDef.name}
            >
              {/* Render the actual Lucide component for preview */}
              <iconDef.icon
                size={28}
                className="text-gray-600 group-hover:text-gray-900 transition-colors mb-2"
                strokeWidth={1.5}
              />
              <span className="text-[10px] text-center text-gray-500 group-hover:text-gray-700 truncate w-full px-1 font-medium">
                {iconDef.name}
              </span>
            </button>
          ))}

          {filteredIcons.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center py-10 text-gray-400">
              <Search size={32} className="mb-2 opacity-20" />
              <p className="text-sm">No icons found.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default IconLibrary;