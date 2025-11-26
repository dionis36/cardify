"use client";

import { useEffect, useState, useMemo } from "react";
import { CardTemplate } from "@/types/template";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateGrid from "@/components/templates/TemplateGrid";
import TemplateFilters from "@/components/templates/TemplateFilters";
import { templateRegistry, TemplateFilterOptions } from "@/lib/templateRegistry";

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [filters, setFilters] = useState<TemplateFilterOptions>({
    category: 'All',
    search: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    // In a real app, this might be an async fetch
    const allTemplates = templateRegistry.getAllTemplates();
    setTemplates(allTemplates);
    setIsLoaded(true);
    setIsLoading(false);
  }, []);

  // Filter logic
  const filteredTemplates = useMemo(() => {
    // Note: In a real app, filtering might be async or server-side
    return templateRegistry.getTemplates(filters);
  }, [filters, templates]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Template Library
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            Jumpstart your design with our professionally crafted templates.
            Customize every detail to match your brand.
          </p>
        </div>
      </div>

      {/* Horizontal Filters Panel */}
      <TemplateFilters filters={filters} onFilterChange={setFilters} />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.category && filters.category !== 'All' ? `${filters.category} Templates` : 'All Templates'}
            </h1>
            <p className="text-gray-500 mt-1">
              {filteredTemplates.length} {filteredTemplates.length === 1 ? 'design' : 'designs'} found
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <TemplateGrid templates={filteredTemplates} />
          )}
        </div>
      </div>
    </main>
  );
};

export default TemplatesPage;
