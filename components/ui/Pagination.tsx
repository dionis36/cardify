import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}: PaginationProps) {
    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // As per screenshot: 1 2 3 4 5

        if (totalPages <= 7) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Complex logic for many pages
            // If near start
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
            // If near end
            else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            }
            // If in middle
            else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col items-center gap-3 sm:gap-4 py-6 sm:py-8">
            {/* Pagination Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border transition-all ${currentPage === 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 sm:gap-1 mx-1 sm:mx-2">
                    {getPageNumbers().map((page, index) => {
                        if (page === '...') {
                            return (
                                <span key={`ellipsis-${index}`} className="px-1 sm:px-2 text-gray-400 text-sm">
                                    ...
                                </span>
                            );
                        }

                        const pageNum = page as number;
                        const isActive = pageNum === currentPage;

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-blue-600 hover:bg-blue-50 active:bg-blue-100'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center rounded-full border transition-all ${currentPage === totalPages
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                    aria-label="Next page"
                >
                    <ChevronRight size={20} className={currentPage === totalPages ? "" : "text-gray-600"} />
                </button>
            </div>

            {/* Summary Text */}
            <p className="text-gray-500 text-xs sm:text-sm text-center px-4">
                {startItem} - {endItem} of {totalItems} business card designs
            </p>
        </div>
    );
}
