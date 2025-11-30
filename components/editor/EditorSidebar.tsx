// components/editor/EditorSidebar.tsx

"use client";

import { useState } from "react";
// FIX: Changing relative imports to full module paths
import LayerList from "@/components/editor/LayerList";
import { ShapeLibrary } from "@/components/editor/ShapeLibrary";
import IconLibrary from "@/components/editor/IconLibrary";
import BackgroundPanel from "@/components/editor/BackgroundPanel";
import QRCodeDesigner from "@/components/editor/QRCodeDesigner";
import ShortcutsReference from "@/components/editor/ShortcutsReference";
import LogoLibraryPanel from "@/components/editor/LogoLibraryPanel"; // NEW IMPORT
import { KonvaNodeDefinition, BackgroundPattern, LayerGroup } from "@/types/template";
import { LogoVariant } from "@/lib/logoIndex"; // NEW IMPORT
import {
    Move, Layers, Settings, Image, Trash2,
    ChevronLeft, ChevronRight, Plus,
    Sparkles, Palette, X, QrCode,
    Hexagon, // NEW ICON
} from "lucide-react";

// Update SidebarTab type to include new tabs
export type SidebarTab = "layers" | "elements" | "icons" | "logos" | "background" | "qrcode" | "settings";
type EditorMode = "FULL_EDIT" | "DATA_ONLY";

interface EditorSidebarProps {
    // NEW SIMPLIFIED ELEMENT CREATION PROPS
    onAddNode: (node: KonvaNodeDefinition) => void;
    onAddImage: (file: File) => void; // Used for asset uploads

    // NEW PROP for background updates (Inferred for BackgroundPanel)
    currentBackground: BackgroundPattern;
    onBackgroundChange: (updates: Partial<BackgroundPattern>) => void;

    // NEW PROP for logo selection
    onSelectLogo?: (logo: LogoVariant) => void;

    // Page Control Props (kept for potential future use, but not displayed)
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

    // NEW: Group Management Props
    groups?: LayerGroup[];
    onGroupChange?: (groupId: string, updates: Partial<LayerGroup>) => void;
    onCreateGroup?: (name: string, layerIndices: number[]) => void;
    onDeleteGroup?: (groupId: string) => void;

    // NEW: External Tab Control
    activeTab?: SidebarTab | null;
    onTabChange?: (tab: SidebarTab | null) => void;
}

export default function EditorSidebar({
    onAddNode,
    onAddImage,
    currentBackground,
    onBackgroundChange, // Destructure new prop
    onSelectLogo, // Destructure new prop
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
    groups,
    onGroupChange,
    onCreateGroup,
    onDeleteGroup,
    activeTab: controlledActiveTab,
    onTabChange,
}: EditorSidebarProps) {
    const isDataOnlyMode = mode === "DATA_ONLY";

    // State tracks which content panel is open. Initial state can be null/closed, 
    // but setting it to 'layers' is common for a focused start.
    const [localActiveTab, setLocalActiveTab] = useState<SidebarTab | null>("layers");

    // Use controlled state if provided, otherwise local
    const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
    const setActiveTab = onTabChange || setLocalActiveTab;

    // --- Tab Navigation (Now Palette Buttons) ---

    const renderPaletteButton = (tab: SidebarTab, Icon: React.FC<any>, label: string, disabled: boolean = false) => {
        const isActive = activeTab === tab;
        return (
            <button
                key={tab}
                onClick={() => setActiveTab(isActive ? null : tab)} // Toggle open/close
                disabled={disabled}
                className={`w-full py-3 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 group relative ${isActive
                    ? "text-blue-500 bg-blue-50/10 border-r-2 border-blue-500"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
                <Icon size={22} strokeWidth={1.5} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {label}
                </span>
            </button>
        );
    };

    // --- Tab Content Renderer ---
    const renderContent = () => {
        if (!activeTab) return null;

        // Common Header for all panels
        const PanelHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2 text-gray-800">
                    {Icon && <Icon size={18} className="text-blue-600" />}
                    <h2 className="font-bold text-base tracking-tight">{title}</h2>
                </div>
                <button
                    onClick={() => setActiveTab(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Close Panel"
                >
                    <X size={18} />
                </button>
            </div>
        );

        switch (activeTab) {
            case "layers":
                return (
                    <div className="flex flex-col h-full">
                        <PanelHeader title="Layers" icon={Layers} />
                        <LayerList
                            layers={layers}
                            selectedIndex={selectedIndex}
                            onSelectLayer={onSelectLayer}
                            onMoveLayer={onMoveLayer}
                            onRemoveLayer={onRemoveLayer}
                            onDefinitionChange={onDefinitionChange}
                            mode={mode}
                            groups={groups}
                            onGroupChange={onGroupChange}
                            onCreateGroup={onCreateGroup}
                            onDeleteGroup={onDeleteGroup}
                        />
                    </div>
                );
            case "elements":
                return (
                    <div className="flex flex-col h-full">
                        <PanelHeader title="Shapes" icon={Move} />
                        <div className="p-4">
                            <ShapeLibrary onAddNode={onAddNode} />
                        </div>
                    </div>
                );

            case "icons":
                return (
                    <div className="flex flex-col h-full">
                        <PanelHeader title="Icons" icon={Sparkles} />
                        <div className="p-4">
                            <IconLibrary onAddLayer={onAddNode} />
                        </div>
                    </div>
                );

            case "logos":
                return (
                    <div className="flex flex-col h-full">
                        <PanelHeader title="Logos" icon={Hexagon} />
                        <div className="p-4">
                            <LogoLibraryPanel onSelectLogo={onSelectLogo || (() => { })} />
                        </div>
                    </div>
                );

            case "background":
                return (
                    <div className="flex flex-col h-full">
                        <PanelHeader title="Background" icon={Palette} />
                        <div className="p-0">
                            <BackgroundPanel currentBackground={currentBackground} onBackgroundChange={onBackgroundChange} />
                        </div>
                    </div>
                );

            case "qrcode":
                const selectedNode = selectedIndex !== null ? layers[selectedIndex] : null;
                const qrMetadata = selectedNode?.type === 'Image' ? (selectedNode.props as any).qrMetadata : undefined;
                return (
                    <div className="flex flex-col h-full">
                        <PanelHeader title="QR Code" icon={QrCode} />
                        <div className="p-4">
                            <QRCodeDesigner onAddImage={onAddImage} onAddNode={onAddNode} initialData={qrMetadata} />
                        </div>
                    </div>
                );

            case "settings":
                return (
                    <div className="flex flex-col h-full">
                        <PanelHeader title="Shortcuts" icon={Settings} />
                        <div className="p-4">
                            <ShortcutsReference />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        // The container is now a flex row
        <div className="flex h-full bg-gray-50 border-r border-gray-200 overflow-hidden font-sans">

            {/* 1. NARROW ICON NAVIGATION PALETTE (Fixed Width: 80px for labels) */}
            <div className="w-20 bg-[#1e1e2e] flex flex-col justify-between items-center py-4 border-r border-gray-800 flex-shrink-0 z-20 shadow-xl">
                {/* Top Navigation Icons */}
                <div className="w-full space-y-1">
                    {renderPaletteButton("layers", Layers, "Layers", isDataOnlyMode)}
                    {renderPaletteButton("elements", Move, "Shapes", isDataOnlyMode)}
                    {renderPaletteButton("icons", Sparkles, "Icons", isDataOnlyMode)}
                    {renderPaletteButton("logos", Hexagon, "Logos", isDataOnlyMode)}
                    {renderPaletteButton("background", Palette, "Bg", isDataOnlyMode)}
                    {renderPaletteButton("qrcode", QrCode, "QR Code", isDataOnlyMode)}
                </div>

                {/* Bottom Navigation Icons (e.g., Settings) */}
                <div className="w-full space-y-1">
                    {renderPaletteButton("settings", Settings, "Settings")}
                </div>
            </div>

            {/* 2. COLLAPSIBLE CONTENT PANEL (Fixed Width: 320px, only shows if a tab is selected) */}
            <div className={`flex-shrink-0 bg-white h-full shadow-lg transition-all duration-300 ease-in-out transform ${activeTab ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-4 opacity-0 overflow-hidden'}`}>
                {/* Only render content if a tab is active */}
                {activeTab && (
                    <div className="h-full overflow-y-auto custom-scrollbar relative">
                        {renderContent()}
                    </div>
                )}
            </div>

        </div>
    );
}



