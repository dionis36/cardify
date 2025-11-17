// components/templates/TemplateFilters.tsx (NEW)

"use client";

import React from "react";
import { TemplateCategoryKey, TEMPLATE_CATEGORIES } from "@/lib/templateCategories";

/**
 * Defines the shape for the template filtering state/options.
 */
export interface FilterOptions {
  category: TemplateCategoryKey[] | "all";
  industry: string[] | "all";
  orientation: "horizontal" | "vertical" | "all";
  colors: string[] | "all";
  search: string;
}

/**
 * Placeholder component for the template gallery filter controls.
 * This component will be built out in a later step to implement the actual filtering logic.
 */
interface TemplateFiltersProps {
    currentFilters: FilterOptions;
    onFilterChange: (filters: Partial<FilterOptions>) => void;
}

export default function TemplateFilters({ currentFilters, onFilterChange }: TemplateFiltersProps) {

    // Simple handler for the select element
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        onFilterChange({ category: value === "all" ? "all" : [value as TemplateCategoryKey] });
    };
    
    // Simple handler for the select element
    const handleOrientationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ orientation: e.target.value as "horizontal" | "vertical" | "all" });
    };

    return (
        <div className="w-64 bg-white p-4 border-r overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Template Filters</h2>
            <div className="space-y-4">
                {/* Search Input */}
                <input 
                    type="text" 
                    placeholder="Search templates..."
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={currentFilters.search}
                    onChange={(e) => onFilterChange({ search: e.target.value })}
                />

                {/* Category Filters */}
                <div className="pt-2 border-t border-gray-200">
                    <h3 className="text-md font-semibold mb-2 text-gray-700">Category</h3>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={currentFilters.category === "all" ? "all" : currentFilters.category[0]}
                        onChange={handleCategoryChange}
                    >
                        <option value="all">All Categories</option>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Orientation Filter */}
                <div className="pt-2 border-t border-gray-200">
                    <h3 className="text-md font-semibold mb-2 text-gray-700">Orientation</h3>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={currentFilters.orientation}
                        onChange={handleOrientationChange}
                    >
                        <option value="all">Any Orientation</option>
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                    </select>
                </div>
                
                {/* Industry and Color Filters will be added in a later step. */}
            </div>
        </div>
    );
}