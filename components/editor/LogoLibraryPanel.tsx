import React, { useState, useMemo } from 'react';
import { LOGO_LIBRARY, getRandomLogo, getLogosByCategory } from '@/lib/logoLibrary';
import { Logo, LogoCategory } from '@/types/logo';
import { Shuffle, Search } from 'lucide-react';

interface LogoLibraryPanelProps {
    onSelectLogo: (logo: Logo) => void;
}

const CATEGORIES: { id: LogoCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'abstract', label: 'Abstract' },
    { id: 'nature', label: 'Nature' },
    { id: 'animal', label: 'Animal' },
    { id: 'tech', label: 'Tech' },
    { id: 'business', label: 'Business' },
];

export default function LogoLibraryPanel({ onSelectLogo }: LogoLibraryPanelProps) {
    const [activeCategory, setActiveCategory] = useState<LogoCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLogos = useMemo(() => {
        let logos = activeCategory === 'all' ? LOGO_LIBRARY : getLogosByCategory(activeCategory);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            logos = logos.filter(logo => logo.name.toLowerCase().includes(query));
        }

        return logos;
    }, [activeCategory, searchQuery]);

    const handleRandomize = () => {
        const logo = getRandomLogo(activeCategory === 'all' ? undefined : activeCategory);
        onSelectLogo(logo);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Logos</h3>

                {/* Randomize Button */}
                <button
                    onClick={handleRandomize}
                    className="w-full mb-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                    <Shuffle size={18} />
                    Randomize Logo
                </button>

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

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeCategory === category.id
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logo Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="grid grid-cols-3 gap-3">
                    {filteredLogos.map((logo) => (
                        <button
                            key={logo.id}
                            onClick={() => onSelectLogo(logo)}
                            className="aspect-square flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-sm transition-all group"
                            title={logo.name}
                        >
                            <svg
                                viewBox={logo.viewBox}
                                className="w-full h-full text-gray-700 group-hover:text-indigo-600 transition-colors"
                                fill="currentColor"
                            >
                                <path d={logo.path} />
                            </svg>
                        </button>
                    ))}
                </div>

                {filteredLogos.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No logos found
                    </div>
                )}
            </div>
        </div>
    );
}
