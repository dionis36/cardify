"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardTemplate } from "@/types/template";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateGrid from "@/components/templates/TemplateGrid";
import TemplateFilters from "@/components/templates/TemplateFilters";
import { templateRegistry, TemplateFilterOptions } from "@/lib/templateRegistry";
import { Pagination } from "@/components/ui/Pagination";

const TemplatesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse page from URL or default to 1
  const initialPage = Number(searchParams.get('page')) || 1;

  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [filters, setFilters] = useState<TemplateFilterOptions>({
    category: searchParams.get('category') || 'All',
    search: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    const allTemplates = templateRegistry.getAllTemplates();
    setTemplates(allTemplates);
    setIsLoaded(true);
    setIsLoading(false);
  }, []);

  // Filter logic
  const filteredTemplates = useMemo(() => {
    return templateRegistry.getTemplates(filters);
  }, [filters, templates]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(initialPage);
  const ITEMS_PER_PAGE = 36;

  // Sync state with URL changes (e.g. Back button)
  useEffect(() => {
    const page = Number(searchParams.get('page')) || 1;
    setCurrentPage(page);

    const category = searchParams.get('category') || 'All';
    if (category !== filters.category) {
      setFilters(prev => ({ ...prev, category }));
    }
  }, [searchParams]);

  // Derived visible templates
  const totalItems = filteredTemplates.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const visibleTemplates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredTemplates.slice(start, end);
  }, [currentPage, filteredTemplates, ITEMS_PER_PAGE]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    if (filters.category && filters.category !== 'All') {
      params.set('category', filters.category);
    } else {
      params.delete('category');
    }

    router.push(`?${params.toString()}`, { scroll: false });

    // Scroll to top of the scrollable content area
    const scrollableContainer = document.querySelector('.flex-1.overflow-y-auto');
    if (scrollableContainer) {
      scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (newFilters: TemplateFilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);

    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (newFilters.category && newFilters.category !== 'All') {
      params.set('category', newFilters.category);
    } else {
      params.delete('category');
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

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
    <main className="min-h-screen bg-gray-50 flex flex-col h-screen">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
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

        {/* Sticky Filters */}
        <TemplateFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Grid Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.category && filters.category !== 'All' ? `${filters.category} Templates` : 'All Templates'}
            </h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <TemplateGrid templates={visibleTemplates} />

              <div className="border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default TemplatesPage;
