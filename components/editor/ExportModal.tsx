"use client";

import React, { useState, useEffect } from "react";
import { X, FileImage, FileText, Download, Loader, Save, LayoutTemplate, Tag, List, Type, Palette, CheckCircle, Info } from "lucide-react";
import { ExportOptions, ExportFormat, TemplateExportMetadata } from "@/types/template";
import { TEMPLATE_CATEGORIES, TemplateCategoryKey } from "@/lib/templateCategories";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => Promise<void>;
    onExportAsTemplate?: (
        metadata: TemplateExportMetadata,
        options?: { strictColorRoles: boolean; forceId?: string }
    ) => Promise<void>;
    templateWidth: number;
    templateHeight: number;
}

export default function ExportModal({
    isOpen: propIsOpen,
    onClose,
    onExport,
    onExportAsTemplate,
    templateWidth,
    templateHeight,
}: ExportModalProps) {
    const isOpen = propIsOpen; // Use prop directly

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
    const [strictColorRoles, setStrictColorRoles] = useState(false);
    const [nextId, setNextId] = useState<string>(''); // NEW: Store the sequential ID separately

    // UI Feedback state
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch next sequential ID when modal opens or tab switches
    useEffect(() => {
        if (isOpen && activeTab === 'template') {
            const fetchNextId = async () => {
                try {
                    const res = await fetch('/api/templates/next-id');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.nextId) {
                            setNextId(data.nextId); // Store ID for filename
                            // DO NOT pre-fill templateName with ID anymore
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch next template ID", error);
                }
            };
            fetchNextId();
        }
    }, [isOpen, activeTab]); // Dependencies adjusted

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
        setSuccessMessage(null); // Reset feedback

        if (activeTab === 'template') {
            if (!onExportAsTemplate) return;
            if (!templateName.trim()) {
                alert('Please enter a template name');
                return;
            }

            const metadata: TemplateExportMetadata = {
                name: templateName.trim(), // User entered name (e.g. Modern Business Card)
                category: templateCategory,
                tags: templateTags.split(',').map(t => t.trim()).filter(Boolean),
                features: templateFeatures.split(',').map(f => f.trim()).filter(Boolean),
            };

            setExporting(true);
            try {
                // Pass metadata AND the enforced filename/ID
                // effectively treating nextId as the forced ID/Filename
                await onExportAsTemplate(metadata, {
                    strictColorRoles,
                    forceId: nextId
                });

                // Show success UI inside modal instead of alert
                setSuccessMessage(nextId || templateName.trim()); // Show ID or Name on success
                setExporting(false);

                // Auto-close after a delay
                setTimeout(() => {
                    onClose();
                    // Reset form after closing
                    setTimeout(() => {
                        setSuccessMessage(null);
                        setTemplateName('');
                        setTemplateTags('');
                        setTemplateFeatures('');
                        setStrictColorRoles(false);
                        setNextId('');
                    }, 300);
                }, 1500);

            } catch (error) {
                console.error("Template export failed:", error);
                setExporting(false);
                alert('Failed to export. See console for details.');
            }
        } else {
            const options: ExportOptions = {
                format,
                fileName,
            };

            setExporting(true);
            try {
                await onExport(options);

                // Show success notification for PNG/PDF exports
                const fileExtension = format.toLowerCase();
                const fullFileName = fileName.endsWith(`.${fileExtension}`) ? fileName : `${fileName}.${fileExtension}`;
                setSuccessMessage(fullFileName);
                setExporting(false);

                // Auto-close after a delay
                setTimeout(() => {
                    onClose();
                    // Reset form after closing
                    setTimeout(() => {
                        setSuccessMessage(null);
                        setFileName('card');
                    }, 300);
                }, 1500);
            } catch (error) {
                console.error("Export failed:", error);
                setExporting(false);
            }
        }
    };

    // Render Success State
    if (successMessage) {
        // Determine if this is a template export or file export
        const isTemplateExport = activeTab === 'template';
        const messageText = isTemplateExport
            ? `Template ${successMessage} has been saved.`
            : `File ${successMessage} has been downloaded.`;
        const titleText = isTemplateExport
            ? 'Export Successful!'
            : 'Download Complete!';

        return (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn p-4"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                }}
            >
                <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full animate-scaleIn">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{titleText}</h3>
                    <p className="text-gray-500 text-center mb-6">
                        {messageText}
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-green-500 animate-[width_1.5s_linear_forwards]" style={{ width: '0%' }} />
                    </div>
                </div>
                <style jsx>{`
                    @keyframes width { from { width: 0%; } to { width: 100%; } }
                `}</style>
            </div>
        );
    }

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
                className="relative w-full max-w-2xl bg-white rounded-2xl lg:shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh] lg:rounded-2xl rounded-t-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header & Tabs */}
                <div className="bg-gray-50 border-b border-gray-200">
                    {/* Mobile Handle */}
                    <div className="lg:hidden flex justify-center pt-3 pb-2">
                        <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
                        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Export Design</h2>
                        <button
                            onClick={onClose}
                            className="p-2 lg:p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Close"
                        >
                            <X size={22} className="lg:w-5 lg:h-5" />
                        </button>
                    </div>

                    {/* Tabs - Segmented Control Style */}
                    <div className="px-4 lg:px-6 pb-0">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('file')}
                                className={`pb-3 px-3 lg:px-4 text-sm font-medium transition-all relative min-h-[48px] flex items-center ${activeTab === 'file'
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
                                    className={`pb-3 px-3 lg:px-4 text-sm font-medium transition-all relative min-h-[48px] flex items-center ${activeTab === 'template'
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
                <div className="p-4 lg:p-8 overflow-y-auto custom-scrollbar pb-6 lg:pb-8">
                    {activeTab === 'file' ? (
                        <div className="space-y-6 lg:space-y-8">
                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm lg:text-sm font-semibold text-gray-900 mb-3 lg:mb-4">
                                    Select Format
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setFormat("PNG")}
                                        className={`
                                            group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                                            ${format === "PNG"
                                                ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                                                : "border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600"
                                            }
                                        `}
                                    >
                                        <div className={`p-2 rounded-full mb-2 transition-colors ${format === "PNG" ? "bg-blue-100" : "bg-gray-100 group-hover:bg-blue-50"}`}>
                                            <FileImage size={24} />
                                        </div>
                                        <span className="font-semibold text-sm">PNG Image</span>
                                        <span className="text-xs opacity-75 mt-0.5">Digital & Web</span>
                                    </button>

                                    <button
                                        onClick={() => setFormat("PDF")}
                                        className={`
                                            group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                                            ${format === "PDF"
                                                ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                                                : "border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600"
                                            }
                                        `}
                                    >
                                        <div className={`p-2 rounded-full mb-2 transition-colors ${format === "PDF" ? "bg-blue-100" : "bg-gray-100 group-hover:bg-blue-50"}`}>
                                            <FileText size={24} />
                                        </div>
                                        <span className="font-semibold text-sm">PDF Document</span>
                                        <span className="text-xs opacity-75 mt-0.5">Printing</span>
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
                                        className="w-full pl-4 pr-12 py-3.5 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
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
                                            list="template-name-suggestions"
                                        />
                                        <datalist id="template-name-suggestions">
                                            <option value="Modern Business Card" />
                                            <option value="Business Card" />
                                            <option value="Professional ID" />
                                            <option value="Event Badge" />
                                        </datalist>
                                        <p className="text-[10px] text-gray-400 mt-1 ml-1 flex items-center gap-1">
                                            {nextId ? (
                                                <>
                                                    <Info size={10} />
                                                    Filename will be <strong>{nextId}.json</strong>
                                                </>
                                            ) : (
                                                'Format: "template-XX" for automatic ordering'
                                            )}
                                        </p>
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
                                            {/* Extended Categories matching the comprehensive list if possible */}
                                            {Object.entries(TEMPLATE_CATEGORIES).map(([key, categoryName]) => (
                                                <option key={key} value={key}>{categoryName}</option>
                                            ))}
                                            {/* Fallback extensions if not in TEMPLATE_CATEGORIES yet */}
                                            <optgroup label="More Categories">
                                                <option value="creative">Creative & Artistic</option>
                                                <option value="tech">Technology & Startups</option>
                                                <option value="luxury">Luxury & Premium</option>
                                            </optgroup>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Color Roles Feature */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-blue-800 font-semibold">
                                        <Palette size={16} />
                                        <span>Color Roles Integration</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={strictColorRoles}
                                            onChange={(e) => setStrictColorRoles(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">Strict Mode</span>
                                    </label>
                                </div>
                                <p className="text-xs text-blue-600/80 leading-relaxed">
                                    Automatically assigns functional roles (surface, accent, text) to elements.
                                    Enable <strong>Strict Mode</strong> to enforce rigorous color mapping based on palette analysis.
                                </p>
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
                                            rows={2}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
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
                                            rows={2}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 lg:px-8 py-4 lg:py-5 flex items-center justify-end gap-2 lg:gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 lg:px-6 py-3 lg:py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm min-h-[48px] flex items-center justify-center"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting || (activeTab === 'template' && !templateName.trim())}
                        className={`
                            px-6 lg:px-8 py-3 lg:py-2.5 rounded-lg font-medium text-white shadow-md transition-all flex items-center gap-2 min-h-[48px] justify-center
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
