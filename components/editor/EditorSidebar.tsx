// components/editor/EditorSidebar.tsx

"use client";

import { useState } from "react";
// FIX: Changing relative imports to full module paths
import LayerList from "@/components/editor/LayerList";
import { ShapeLibrary } from "@/components/editor/ShapeLibrary";
import IconLibrary from "@/components/editor/IconLibrary";
import BackgroundPanel from "@/components/editor/BackgroundPanel";
import { KonvaNodeDefinition, BackgroundPattern } from "@/types/template";
import {
    Move, Layers, Settings, Image, Trash2,
    ChevronLeft, ChevronRight, Plus,
    Sparkles, Palette, X,
} from "lucide-react";

// Update SidebarTab type to include new tabs
type SidebarTab = "layers" | "elements" | "icons" | "background" | "pages";
type EditorMode = "FULL_EDIT" | "DATA_ONLY";

interface EditorSidebarProps {
    // NEW SIMPLIFIED ELEMENT CREATION PROPS
    onAddNode: (node: KonvaNodeDefinition) => void;
    onAddImage: (file: File) => void; // Used for asset uploads

    // NEW PROP for background updates (Inferred for BackgroundPanel)
    currentBackground: BackgroundPattern;
    onBackgroundChange: (updates: Partial<BackgroundPattern>) => void;

    // Page Control Props
    addPage: () => void;
    removePage: () => void;
    pageCount: number;
    currentPage: number;
    gotoPage: (i: number) => void;

    // Layer Management Props (Passed to LayerList)
    layers: KonvaNodeDefinition[];
    selectedIndex: number | null;
    onSelectLayer: (index: number | null) => void;
    onMoveLayer: (from: number, to: number) => void;
    onRemoveLayer: (index: number) => void;
    onDefinitionChange: (index: number, updates: Partial<KonvaNodeDefinition>) => void;

    mode: EditorMode;
}

export default function EditorSidebar({
    onAddNode,
    onAddImage,
    currentBackground,
    onBackgroundChange, // Destructure new prop
    addPage,
    removePage,
    pageCount,
    currentPage,
    gotoPage,
    layers,
    selectedIndex,
    onSelectLayer,
    onMoveLayer,
    onRemoveLayer,
    onDefinitionChange,
    mode,
}: EditorSidebarProps) {
    const isDataOnlyMode = mode === "DATA_ONLY";

    // State tracks which content panel is open. Initial state can be null/closed, 
    // but setting it to 'layers' is common for a focused start.
    const [activeTab, setActiveTab] = useState<SidebarTab | null>("layers");

    // --- Tab Navigation (Now Palette Buttons) ---

    const renderPaletteButton = (tab: SidebarTab, Icon: React.FC<any>, label: string, disabled: boolean = false) => (
        // Note: Assuming a simple Tooltip component is available for the professional look
        // If not, the 'title' attribute will serve as a basic tooltip
        <button
            key={tab}
            onClick={() => setActiveTab(activeTab === tab ? null : tab)} // Toggle open/close
            disabled={disabled}
            title={label}
            className={`w-12 h-12 rounded-lg transition-colors flex items-center justify-center ${activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50"
                } ${disabled ? 'cursor-not-allowed' : ''}`}
        >
            <Icon size={20} strokeWidth={1.5} />
        </button>
    );

    // --- Tab Content Renderer ---
    const renderContent = () => {
        if (!activeTab) return null;

        switch (activeTab) {
            case "layers":
                return (
                    <LayerList
                        layers={layers}
                        selectedIndex={selectedIndex}
                        onSelectLayer={onSelectLayer}
                        onMoveLayer={onMoveLayer}
                        onRemoveLayer={onRemoveLayer}
                        onDefinitionChange={onDefinitionChange}
                        mode={mode}
                    />
                );
            case "elements":
                // ShapeLibrary uses the generic onAddNode for all shapes (text, rect, circle, etc.)
                return <ShapeLibrary onAddNode={onAddNode} />;

            case "icons":
                // IconLibrary also uses the generic onAddNode
                return <IconLibrary onAddLayer={onAddNode} />;

            case "background":
                // BackgroundPanel handles background color/image changes
                return <BackgroundPanel currentBackground={currentBackground} onBackgroundChange={onBackgroundChange} />;

            case "pages":
                return (
                    // Page management content
                    <div className="p-4 space-y-4">
                        <h3 className="font-bold text-lg">Page Controls</h3>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg justify-between">
                            <button
                                onClick={removePage}
                                disabled={pageCount <= 1}
                                className="p-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                            >
                                <Trash2 size={18} />
                            </button>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => gotoPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="p-1 rounded hover:bg-gray-200"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="font-semibold text-sm">Page {currentPage} of {pageCount}</span>
                                <button
                                    onClick={() => gotoPage(currentPage + 1)}
                                    disabled={currentPage >= pageCount}
                                    className="p-1 rounded hover:bg-gray-200"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            <button
                                onClick={addPage}
                                className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        {/* More page settings could go here */}
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        // The container is now a flex row
        <div className="flex h-full bg-white border-r border-gray-200 overflow-hidden">

            {/* 1. NARROW ICON NAVIGATION PALETTE (Fixed Width: 64px) */}
            <div className="w-16 bg-gray-900 flex flex-col justify-between items-center py-4 border-r border-gray-800 flex-shrink-0">
                {/* Top Navigation Icons */}
                <div className="space-y-2">
                    {renderPaletteButton("layers", Layers, "Layers", isDataOnlyMode)}
                    {renderPaletteButton("elements", Move, "Shapes", isDataOnlyMode)}
                    {renderPaletteButton("icons", Sparkles, "Icons", isDataOnlyMode)}
                    {renderPaletteButton("background", Palette, "Background", isDataOnlyMode)}
                </div>

                {/* Bottom Navigation Icons (e.g., Settings) */}
                <div className="space-y-2">
                    {renderPaletteButton("pages", Settings, "Pages")}
                </div>
            </div>

            {/* 2. COLLAPSIBLE CONTENT PANEL (Fixed Width: 320px, only shows if a tab is selected) */}
            {/* Added dynamic class to hide the panel if activeTab is null */}
            <div className={`flex-shrink-0 bg-white transition-all duration-500 ease-in-out ${activeTab ? 'w-80 border-r border-gray-200' : 'w-0'}`}>
                {/* Only render content if a tab is active */}
                {activeTab && (
                    <div className="h-full overflow-y-auto relative">
                        {/* Close Button: Click on active tab in palette or use X button to collapse */}
                        <button
                            onClick={() => setActiveTab(null)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 z-10 transition-colors"
                            title="Close Sidebar"
                        >
                            <X size={20} />
                        </button>
                        <div className="pt-8 pb-4">
                            {renderContent()}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}



