"use client";

import React from "react";
import { Layers, Plus, Palette, Eye, Settings } from "lucide-react";

interface MobileBottomToolbarProps {
    onShowLayers: () => void;
    onShowAddMenu: () => void;
    onShowBackground: () => void;
    onToggleView: () => void;
    onShowTools: () => void;
    selectedCount?: number;
}

interface ToolbarButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    badge?: number;
    primary?: boolean;
}

function ToolbarButton({ icon: Icon, label, onClick, badge, primary }: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors touch-target relative ${primary
                    ? "text-blue-600 hover:bg-blue-50 active:bg-blue-100"
                    : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                }`}
        >
            <div className="relative">
                <Icon size={24} strokeWidth={primary ? 2.5 : 2} />
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {badge}
                    </span>
                )}
            </div>
            <span className={`text-[10px] font-medium ${primary ? "text-blue-600" : "text-gray-600"}`}>
                {label}
            </span>
        </button>
    );
}

export default function MobileBottomToolbar({
    onShowLayers,
    onShowAddMenu,
    onShowBackground,
    onToggleView,
    onShowTools,
    selectedCount = 0,
}: MobileBottomToolbarProps) {
    return (
        <div className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-200 z-50 flex items-center justify-around px-2 safe-area-inset-bottom shadow-lg">
            <ToolbarButton icon={Layers} label="Layers" onClick={onShowLayers} badge={selectedCount} />
            <ToolbarButton icon={Plus} label="Add" onClick={onShowAddMenu} primary />
            <ToolbarButton icon={Palette} label="Background" onClick={onShowBackground} />
            <ToolbarButton icon={Eye} label="View" onClick={onToggleView} />
            <ToolbarButton icon={Settings} label="Tools" onClick={onShowTools} />
        </div>
    );
}
