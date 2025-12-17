"use client";

import React, { useRef, useEffect } from "react";
import { Layers, Palette, Settings, Square, Sparkles, Hexagon, Image, QrCode, Type } from "lucide-react";

// Mobile panel types - MUST match desktop SidebarTab
type MobilePanelType =
    | 'layers'      // Tab
    | 'elements'    // Tab (Shapes - matches desktop)
    | 'icons'       // Tab
    | 'logos'       // Tab
    | 'images'      // Tab
    | 'background'  // Tab
    | 'qrcode'      // Tab
    | 'settings'    // Tab
    | 'properties'  // Special (auto-shows on selection)
    | null;

interface MobileBottomToolbarProps {
    activePanel: MobilePanelType;
    onPanelChange: (panel: MobilePanelType) => void;
    onAddText: () => void; // NEW: Direct action for adding text
    selectedCount?: number;
}

interface ToolbarButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    badge?: number;
    active?: boolean;
    buttonRef?: React.RefObject<HTMLButtonElement>;
}

function ToolbarButton({ icon: Icon, label, onClick, badge, active, buttonRef }: ToolbarButtonProps) {
    return (
        <button
            ref={buttonRef}
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all touch-target relative min-w-[64px] flex-shrink-0 ${active
                    ? "bg-blue-50 text-blue-600 ring-2 ring-blue-600 ring-inset"
                    : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                }`}
        >
            <div className="relative">
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {badge}
                    </span>
                )}
            </div>
            <span className={`text-[10px] font-medium ${active ? "text-blue-600" : "text-gray-600"}`}>
                {label}
            </span>
        </button>
    );
}

export default function MobileBottomToolbar({
    activePanel,
    onPanelChange,
    onAddText,
    selectedCount = 0,
}: MobileBottomToolbarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = {
        layers: useRef<HTMLButtonElement>(null),
        text: useRef<HTMLButtonElement>(null),
        elements: useRef<HTMLButtonElement>(null),
        icons: useRef<HTMLButtonElement>(null),
        logos: useRef<HTMLButtonElement>(null),
        images: useRef<HTMLButtonElement>(null),
        background: useRef<HTMLButtonElement>(null),
        qrcode: useRef<HTMLButtonElement>(null),
        settings: useRef<HTMLButtonElement>(null),
    };

    // Scroll active button to center when panel changes
    useEffect(() => {
        if (!activePanel || !scrollContainerRef.current) return;

        const activeButtonRef = buttonRefs[activePanel as keyof typeof buttonRefs];
        if (!activeButtonRef?.current) return;

        const container = scrollContainerRef.current;
        const button = activeButtonRef.current;

        // Calculate position to center the button
        const containerWidth = container.offsetWidth;
        const buttonLeft = button.offsetLeft;
        const buttonWidth = button.offsetWidth;
        const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

        // Smooth scroll to center
        container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    }, [activePanel]);

    return (
        <div
            ref={scrollContainerRef}
            className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-200 z-50 overflow-x-auto overflow-y-hidden safe-area-inset-bottom shadow-lg"
        >
            {/* Scrollable container - EXACT MATCH to desktop sidebar order */}
            <div className="flex items-center gap-2 px-2 h-full min-w-max">
                {/* 1. Layers - Tab */}
                <ToolbarButton
                    icon={Layers}
                    label="Layers"
                    active={activePanel === 'layers'}
                    onClick={() => onPanelChange('layers')}
                    badge={selectedCount}
                    buttonRef={buttonRefs.layers}
                />

                {/* 2. Text - DIRECT ACTION (not a tab!) */}
                <ToolbarButton
                    icon={Type}
                    label="Text"
                    active={false} // Never active (it's an action, not a panel)
                    onClick={onAddText}
                    buttonRef={buttonRefs.text}
                />

                {/* 3. Shapes - Tab (uses 'elements' internally) */}
                <ToolbarButton
                    icon={Square}
                    label="Shapes"
                    active={activePanel === 'elements'}
                    onClick={() => onPanelChange('elements')}
                    buttonRef={buttonRefs.elements}
                />

                {/* 4. Icons - Tab */}
                <ToolbarButton
                    icon={Sparkles}
                    label="Icons"
                    active={activePanel === 'icons'}
                    onClick={() => onPanelChange('icons')}
                    buttonRef={buttonRefs.icons}
                />

                {/* 5. Logos - Tab */}
                <ToolbarButton
                    icon={Hexagon}
                    label="Logos"
                    active={activePanel === 'logos'}
                    onClick={() => onPanelChange('logos')}
                    buttonRef={buttonRefs.logos}
                />

                {/* 6. Images - Tab */}
                <ToolbarButton
                    icon={Image}
                    label="Images"
                    active={activePanel === 'images'}
                    onClick={() => onPanelChange('images')}
                    buttonRef={buttonRefs.images}
                />

                {/* 7. Background - Tab */}
                <ToolbarButton
                    icon={Palette}
                    label="Background"
                    active={activePanel === 'background'}
                    onClick={() => onPanelChange('background')}
                    buttonRef={buttonRefs.background}
                />

                {/* 8. QR Code - Tab */}
                <ToolbarButton
                    icon={QrCode}
                    label="QR Code"
                    active={activePanel === 'qrcode'}
                    onClick={() => onPanelChange('qrcode')}
                    buttonRef={buttonRefs.qrcode}
                />

                {/* 9. Settings - Tab */}
                <ToolbarButton
                    icon={Settings}
                    label="Settings"
                    active={activePanel === 'settings'}
                    onClick={() => onPanelChange('settings')}
                    buttonRef={buttonRefs.settings}
                />
            </div>
        </div>
    );
}
