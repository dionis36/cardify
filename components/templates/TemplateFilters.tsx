import React, { useState } from "react";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { TemplateFilterOptions, templateRegistry } from "@/lib/templateRegistry";

interface TemplateFiltersProps {
    filters: TemplateFilterOptions;
    onFilterChange: (filters: TemplateFilterOptions) => void;
}

export default function TemplateFilters({ filters, onFilterChange }: TemplateFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const categories = ['All', ...templateRegistry.getCategories()];
    const colors = templateRegistry.getAvailableColors();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, search: e.target.value });
    };

    const handleCategoryChange = (category: string) => {
        onFilterChange({ ...filters, category: category === 'All' ? undefined : category });
    };

    const handleColorChange = (color: string) => {
        onFilterChange({ ...filters, color: filters.color === color ? undefined : color });
    };

    const clearFilters = () => {
        onFilterChange({ search: filters.search }); // Keep search, clear others
    };

    const activeFiltersCount = (filters.category ? 1 : 0) + (filters.color ? 1 : 0);

    return (
        <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Search Bar - Always Visible */}
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search templates..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            value={filters.search || ''}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isOpen || activeFiltersCount > 0
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <Filter size={18} />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {/* Collapsible Filter Panel */}
                {isOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Categories */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                    Category
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => handleCategoryChange(category)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${(filters.category === category) || (!filters.category && category === 'All')
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Color Theme
                                    </h3>
                                    {activeFiltersCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                                        >
                                            <X size={12} />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleColorChange(color)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${filters.color === color
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full border border-gray-200"
                                                style={{ backgroundColor: color.toLowerCase() }}
                                            />
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
