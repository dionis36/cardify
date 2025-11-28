import React, { useState, useMemo } from 'react';
import { AVAILABLE_LOGOS, LogoVariant } from '@/lib/logoIndex';
import { Search } from 'lucide-react';

interface LogoLibraryPanelProps {
    onSelectLogo: (logoVariant: LogoVariant) => void;
}

export default function LogoLibraryPanel({ onSelectLogo }: LogoLibraryPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLogos = useMemo(() => {
        let logos = AVAILABLE_LOGOS;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            logos = logos.filter(logo => logo.name.toLowerCase().includes(query));
        }

        return logos;
    }, [searchQuery]);

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Logos</h3>

                {/* Search Input */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search logos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Logo Grid - Now shows each logo with all its color variants */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
                {filteredLogos.map((logoFamily) => (
                    <div key={logoFamily.id} className="space-y-2">
                        {/* Logo Family Name */}
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {logoFamily.name}
                        </h4>

                        {/* Color Variants Grid */}
                        <div className="grid grid-cols-5 gap-2">
                            {logoFamily.variants.map((variant) => (
                                <button
                                    key={`${logoFamily.id}_${variant.color}`}
                                    onClick={() => onSelectLogo(variant)}
                                    className="aspect-square flex flex-col items-center justify-center p-1.5 bg-white border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-md transition-all group relative"
                                    title={`${logoFamily.name} - ${variant.color}`}
                                >
                                    {/* Logo Image */}
                                    <img
                                        src={variant.path}
                                        alt={`${logoFamily.name} ${variant.color}`}
                                        className="w-full h-full object-contain"
                                    />

                                    {/* Color Label - Shows on hover */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-[9px] font-medium text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md">
                                        {variant.color}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredLogos.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No logos found
                    </div>
                )}
            </div>
        </div>
    );
}
