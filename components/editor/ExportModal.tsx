"use client";

import React, { useState, useEffect } from "react";
import { X, FileImage, FileText, Download, Loader } from "lucide-react";
import { ExportOptions, ExportFormat } from "@/types/template";
import { estimateFileSize } from "@/lib/exportUtils";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => Promise<void>;
    templateWidth: number;
    templateHeight: number;
}

export default function ExportModal({
    isOpen,
    onClose,
    onExport,
    templateWidth,
    templateHeight,
}: ExportModalProps) {
    const [format, setFormat] = useState<ExportFormat>("PNG");
    const [fileName, setFileName] = useState<string>("card");
    const [exporting, setExporting] = useState(false);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
        }
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleExport = async () => {
        const options: ExportOptions = {
            format,
            fileName,
            // Internal defaults handled by lib/pdf.ts
        };

        setExporting(true);
        try {
            await onExport(options);
            // Close modal after successful export
            setTimeout(() => {
                onClose();
                setExporting(false);
            }, 500);
        } catch (error) {
            console.error("Export failed:", error);
            setExporting(false);
        }
    };

    // Calculate file size estimate (Always 300 DPI now)
    const dpi = 300;
    const pixelRatio = dpi / 72;
    const finalWidth = templateWidth * pixelRatio;
    const finalHeight = templateHeight * pixelRatio;
    const fileSize = estimateFileSize(finalWidth, finalHeight, format, dpi);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Export Design</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Close"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Format
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setFormat("PNG")}
                                className={`
                                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                                    ${format === "PNG"
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                                    }
                                `}
                            >
                                <FileImage size={32} className="mb-2" />
                                <span className="font-semibold">PNG Image</span>
                                <span className="text-xs opacity-75 mt-1">Digital & Web</span>
                            </button>

                            <button
                                onClick={() => setFormat("PDF")}
                                className={`
                                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                                    ${format === "PDF"
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                                    }
                                `}
                            >
                                <FileText size={32} className="mb-2" />
                                <span className="font-semibold">PDF Document</span>
                                <span className="text-xs opacity-75 mt-1">Print Ready</span>
                            </button>
                        </div>
                    </div>

                    {/* File Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            File Name
                        </label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="card"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Info 
                    <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <p>High Quality Export (300 DPI)</p>
                        <p className="text-xs mt-1">Estimated Size: {fileSize}</p>
                        {format === "PDF" && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                                Includes 3mm Bleed for Professional Printing
                            </p>
                        )}
                    </div>
                    */}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {exporting ? (
                            <>
                                <Loader size={16} className="animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                Download
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
