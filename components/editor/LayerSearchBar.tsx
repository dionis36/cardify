// components/editor/LayerSearchBar.tsx
"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { KonvaNodeType } from "@/types/template";

interface LayerSearchBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterType: KonvaNodeType | "all";
    onFilterTypeChange: (type: KonvaNodeType | "all") => void;
}

export default function LayerSearchBar({
    searchQuery,
    onSearchChange,
    filterType,
    onFilterTypeChange,
}: LayerSearchBarProps) {
    return (
        <div className="px-4 pb-3 space-y-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search layers..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        title="Clear search"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Filter by Type */}
            <select
                value={filterType}
                onChange={(e) => onFilterTypeChange(e.target.value as KonvaNodeType | "all")}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="all">All Types</option>
                <option value="Text">Text</option>
                <option value="Image">Image</option>
                <option value="Rect">Rectangle</option>
                <option value="Circle">Circle</option>
                <option value="Ellipse">Ellipse</option>
                <option value="Star">Star</option>
                <option value="Icon">Icon</option>
                <option value="Path">Path</option>
                <option value="Line">Line</option>
                <option value="Arrow">Arrow</option>
            </select>
        </div>
    );
}
