"use client";

import React, { useState, useEffect } from "react";
import { X, FileImage, FileText, Download, Loader, Save, LayoutTemplate, Tag, List, Type } from "lucide-react";
import { ExportOptions, ExportFormat, TemplateExportMetadata } from "@/types/template";
import { estimateFileSize } from "@/lib/exportUtils";
import { TEMPLATE_CATEGORIES, TemplateCategoryKey } from "@/lib/templateCategories";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => Promise<void>;
    onExportAsTemplate?: (metadata: TemplateExportMetadata) => Promise<void>;
    templateWidth: number;
    templateHeight: number;
}

export default function ExportModal({
    isOpen,
    onClose,
    onExport,
    onExportAsTemplate,
    templateWidth,
    templateHeight,
}: ExportModalProps) {
    type ExportTab = 'file' | 'template';
    const [activeTab, setActiveTab] = useState<ExportTab>('file');
    const [format, setFormat] = useState<ExportFormat>("PNG");
    const [fileName, setFileName] = useState<string>("card");
    const [exporting, setExporting] = useState(false);

    // Template export state
    const [templateName, setTemplateName] = useState('');
    const [templateCategory, setTemplateCategory] = useState<TemplateCategoryKey>('professional');
    const [templateTags, setTemplateTags] = useState('');
    const [templateFeatures, setTemplateFeatures] = useState('');

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
        if (activeTab === 'template') {
            if (!onExportAsTemplate) return;
            if (!templateName.trim()) {
                alert('Please enter a template name');
                return;
            }

            const metadata: TemplateExportMetadata = {
                name: templateName.trim(),
                category: templateCategory,
                tags: templateTags.split(',').map(t => t.trim()).filter(Boolean),
                features: templateFeatures.split(',').map(f => f.trim()).filter(Boolean),
            };

            setExporting(true);
            try {
                await onExportAsTemplate(metadata);
                setTimeout(() => {
                    onClose();
                    setExporting(false);
                    // Reset form
                    setTemplateName('');
                    setTemplateTags('');
                    setTemplateFeatures('');
                }, 500);
            } catch (error) {
                console.error("Template export failed:", error);
                setExporting(false);
            }
        } else {
            const options: ExportOptions = {
                format,
                fileName,
            };

            setExporting(true);
            try {
                await onExport(options);
                setTimeout(() => {
                    onClose();
                    setExporting(false);
                }, 500);
            } catch (error) {
                console.error("Export failed:", error);
                setExporting(false);
            }
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn p-4"
            onClick={onClose}
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
            }}
        >
            <div
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header & Tabs */}
                <div className="bg-gray-50 border-b border-gray-200">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Export Design</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs - Segmented Control Style */}
                    <div className="px-6 pb-0">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('file')}
                                className={`pb-3 px-4 text-sm font-medium transition-all relative ${activeTab === 'file'
                                        ? 'text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Download size={16} />
                                    Export File
                                </div>
                                {activeTab === 'file' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                                )}
                            </button>

                            {onExportAsTemplate && (
                                <button
                                    onClick={() => setActiveTab('template')}
                                    className={`pb-3 px-4 text-sm font-medium transition-all relative ${activeTab === 'template'
                                            ? 'text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <LayoutTemplate size={16} />
                                        Save as Template
                                    </div>
                                    {activeTab === 'template' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {activeTab === 'file' ? (
                        <div className="space-y-8">
                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-4">
                                    Select Format
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setFormat("PNG")}
                                        className={`
                                            group flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200
                                            ${format === "PNG"
                                                ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                                                : "border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600"
                                            }
                                        `}
                                    >
                                        <div className={`p-3 rounded-full mb-3 transition-colors ${format === "PNG" ? "bg-blue-100" : "bg-gray-100 group-hover:bg-blue-50"}`}>
                                            <FileImage size={28} />
                                        </div>
                                        <span className="font-semibold text-lg">PNG Image</span>
                                        <span className="text-sm opacity-75 mt-1">Best for Digital & Web</span>
                                    </button>

                                    <button
                                        onClick={() => setFormat("PDF")}
                                        className={`
                                            group flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200
                                            ${format === "PDF"
                                                ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                                                : "border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600"
                                            }
                                        `}
                                    >
                                        <div className={`p-3 rounded-full mb-3 transition-colors ${format === "PDF" ? "bg-blue-100" : "bg-gray-100 group-hover:bg-blue-50"}`}>
                                            <FileText size={28} />
                                        </div>
                                        <span className="font-semibold text-lg">PDF Document</span>
                                        <span className="text-sm opacity-75 mt-1">Best for Printing</span>
                                    </button>
                                </div>
                            </div>

                            {/* File Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    File Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        placeholder="card"
                                        className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                        .{format.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Row 1: Name & Category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Template Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Type size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            placeholder="e.g., Modern Business Card"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={templateCategory}
                                            onChange={(e) => setTemplateCategory(e.target.value as TemplateCategoryKey)}
                                            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                                        >
                                            {Object.entries(TEMPLATE_CATEGORIES).map(([key, categoryName]) => (
                                                <option key={key} value={key}>{categoryName}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Tags & Features */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Tags
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Tag size={18} />
                                        </div>
                                        <textarea
                                            value={templateTags}
                                            onChange={(e) => setTemplateTags(e.target.value)}
                                            placeholder="modern, clean, corporate..."
                                            rows={3}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5">Comma-separated keywords</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Key Features
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <List size={18} />
                                        </div>
                                        <textarea
                                            value={templateFeatures}
                                            onChange={(e) => setTemplateFeatures(e.target.value)}
                                            placeholder="QR Code, Logo Placeholder, Social Icons..."
                                            rows={3}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5">Comma-separated features list</p>
                                </div>
                            </div>

                            {/* Admin Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                                <div className="p-1 bg-amber-100 rounded-full text-amber-600 mt-0.5">
                                    <LayoutTemplate size={16} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-amber-900">Admin Access Only</h4>
                                    <p className="text-sm text-amber-700 mt-0.5">
                                        This feature creates a new template in the public gallery. It will be restricted when authentication is implemented.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting || (activeTab === 'template' && !templateName.trim())}
                        className={`
                            px-8 py-2.5 rounded-lg font-medium text-white shadow-md transition-all flex items-center gap-2
                            ${exporting || (activeTab === 'template' && !templateName.trim())
                                ? 'bg-blue-400 cursor-not-allowed opacity-75'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            }
                        `}
                    >
                        {exporting ? (
                            <>
                                <Loader size={18} className="animate-spin" />
                                {activeTab === 'template' ? 'Saving Template...' : 'Processing...'}
                            </>
                        ) : (
                            <>
                                {activeTab === 'template' ? (
                                    <>
                                        <Save size={18} />
                                        Save Template
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Download File
                                    </>
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }

                .animate-scaleIn {
                    animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
}
