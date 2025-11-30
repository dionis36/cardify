'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getIcon, searchIcons, getDefaultIconProps } from '@/lib/iconLoader';
import { KonvaNodeDefinition, IconProps } from '@/types/template';

interface IconLibraryProps {
  onAddLayer: (layer: KonvaNodeDefinition) => void;
}

const IconPreview = ({ iconName }: { iconName: string }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');

  useEffect(() => {
    const iconData = getIcon(iconName);
    if (!iconData) return;

    const isLucide = iconName.startsWith('lucide:') || !iconName.includes(':');
    // Lucide needs stroke, others usually fill
    const attrs = isLucide
      ? 'fill="none" stroke="currentColor" stroke-width="2"'
      : 'fill="currentColor" stroke="none"';

    setSvgHtml(`<svg viewBox="0 0 ${iconData.width} ${iconData.height}" width="100%" height="100%" ${attrs}>${iconData.body}</svg>`);
  }, [iconName]);

  if (!svgHtml) return <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svgHtml }}
      className="w-7 h-7 text-gray-600 group-hover:text-gray-900 transition-colors mb-2"
    />
  );
};

const IconLibrary: React.FC<IconLibraryProps> = ({ onAddLayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Common icons configuration
  const COMMON_ICONS = {
    'Essentials': ['lucide:home', 'lucide:user', 'lucide:settings', 'lucide:mail', 'lucide:phone', 'lucide:search', 'lucide:bell', 'lucide:trash', 'lucide:star', 'lucide:heart'],
    'Social': ['fa6-brands:facebook', 'fa6-brands:twitter', 'fa6-brands:instagram', 'fa6-brands:linkedin', 'fa6-brands:youtube', 'fa6-brands:tiktok', 'fa6-brands:whatsapp', 'fa6-brands:discord'],
    'Business': ['lucide:briefcase', 'lucide:credit-card', 'lucide:dollar-sign', 'lucide:pie-chart', 'lucide:trending-up', 'lucide:target', 'lucide:award', 'lucide:calendar'],
    'Arrows': ['lucide:arrow-right', 'lucide:arrow-left', 'lucide:chevron-down', 'lucide:chevron-up', 'lucide:refresh-ccw', 'lucide:download', 'lucide:upload'],
  };

  const CATEGORIES = ['All', ...Object.keys(COMMON_ICONS)];

  // Initial load & Search
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let results: { prefix: string; name: string }[] = [];

      if (!searchTerm.trim()) {
        // If no search, show icons based on active category
        if (activeCategory === 'All') {
          // Show a mix of everything
          const allCommon = Object.values(COMMON_ICONS).flat();
          setIcons(allCommon);
        } else {
          setIcons(COMMON_ICONS[activeCategory as keyof typeof COMMON_ICONS] || []);
        }
      } else {
        // Search mode
        const searchResults = searchIcons(searchTerm, 100);
        setIcons(searchResults.map(r => `${r.prefix}:${r.name}`));
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, activeCategory]);

  const handleAddIcon = useCallback((fullIconName: string) => {
    const timestamp = Date.now();
    const id = `icon_${timestamp}`;

    // Get default props
    const defaultProps = getDefaultIconProps(fullIconName);

    // Determine default style based on set
    const isLucide = fullIconName.startsWith('lucide:') || !fullIconName.includes(':');

    const newIconLayer: KonvaNodeDefinition = {
      id,
      type: 'Icon',
      props: {
        id,
        ...defaultProps,
        iconName: fullIconName,
        // Set appropriate defaults for the icon type
        fill: isLucide ? 'transparent' : '#000000',
        stroke: isLucide ? '#000000' : 'transparent',
        strokeWidth: isLucide ? 2 : 0,
      } as IconProps,
      editable: true,
      locked: false,
    };

    onAddLayer(newIconLayer);
  }, [onAddLayer]);

  return (
    <div className="flex flex-col h-full space-y-4">

      {/* Search Bar */}
      <div className="relative shrink-0">
        <input
          type="text"
          placeholder="Search 50,000+ icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 text-gray-900 p-2.5 pl-9 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 placeholder-gray-400 shadow-sm"
        />
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Categories (Only show when not searching) */}
      {!searchTerm.trim() && (
        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                        px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all
                        ${activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-gray-200'}
                    `}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Icon Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 pb-20">
            {icons.map((iconName) => (
              <button
                key={iconName}
                onClick={() => handleAddIcon(iconName)}
                className="
                    group flex flex-col items-center justify-center 
                    p-3 h-24 rounded-lg
                    bg-white border border-gray-200 
                    hover:bg-gray-50 hover:border-gray-300 hover:shadow-md
                    transition-all duration-200
                "
                title={iconName}
              >
                <IconPreview iconName={iconName} />
                <span className="text-[10px] text-center text-gray-500 group-hover:text-gray-700 truncate w-full px-1 font-medium">
                  {iconName.split(':')[1] || iconName}
                </span>
              </button>
            ))}

            {icons.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-10 text-gray-400">
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No icons found.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default IconLibrary;