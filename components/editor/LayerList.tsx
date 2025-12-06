// components/editor/LayerList.tsx (ENHANCED - Groups, Search, Bulk Operations)

"use client";

import { KonvaNodeDefinition, LayerGroup, KonvaNodeType } from "@/types/template";
import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Eye, EyeOff, Lock, Unlock, Trash2, Folder, FolderOpen, Check, Layers, Type, Image as ImageIcon, Move } from "lucide-react";
import LayerSearchBar from "./LayerSearchBar";
import BulkActionsToolbar from "./BulkActionsToolbar";
import ConfirmationModal from "../ui/ConfirmationModal";


interface LayerListProps {
  layers: KonvaNodeDefinition[];
  selectedIndex: number | null;
  onSelectLayer: (index: number | null) => void;
  onMoveLayer: (from: number, to: number) => void;
  onRemoveLayer: (index: number) => void;
  onDefinitionChange: (index: number, updates: Partial<KonvaNodeDefinition>) => void;
  mode: "FULL_EDIT" | "DATA_ONLY";

  // NEW: Group support
  groups?: LayerGroup[];
  onGroupChange?: (groupId: string, updates: Partial<LayerGroup>) => void;
  onCreateGroup?: (name: string, layerIndices: number[]) => void;
  onDeleteGroup?: (groupId: string) => void;
}

export default function LayerList({
  layers,
  selectedIndex,
  onSelectLayer,
  onMoveLayer,
  onRemoveLayer,
  onDefinitionChange,
  mode,
  groups = [],
  onGroupChange,
  onCreateGroup,
  onDeleteGroup,
}: LayerListProps) {
  // Drag state
  const [draggedListIndex, setDraggedListIndex] = useState<number | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<KonvaNodeType | "all">("all");

  // Bulk selection state
  const [bulkSelectedIndices, setBulkSelectedIndices] = useState<number[]>([]);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.filter(g => g.expanded).map(g => g.id))
  );

  // Reverse layers for display (front to back)
  const reversedLayers = [...layers].reverse();

  // Utility to convert list index to Konva index
  const mapListIndexToKonvaIndex = (listIndex: number): number => {
    return layers.length - 1 - listIndex;
  };

  // Filter layers based on search and type
  const filteredLayers = useMemo(() => {
    return reversedLayers.filter((layer, listIndex) => {
      // Type filter
      if (filterType !== "all" && layer.type !== filterType) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const layerName = getLayerName(layer).toLowerCase();
        return layerName.includes(query);
      }

      return true;
    });
  }, [reversedLayers, filterType, searchQuery]);

  // Get layer display name
  function getLayerName(layer: KonvaNodeDefinition): string {
    if (layer.type === 'Text') {
      return `Text: ${(layer.props as any).text || 'Empty'}`;
    } else if (layer.type === 'Image') {
      return (layer.props as any).qrMetadata ? 'QR Code' : 'Image';
    } else {
      return layer.type;
    }
  }

  // Drag handlers
  const handleDragStart = (listIndex: number) => {
    setDraggedListIndex(listIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropListIndex: number) => {
    e.preventDefault();
    if (draggedListIndex === null || draggedListIndex === dropListIndex) return;

    const fromKonvaIndex = mapListIndexToKonvaIndex(draggedListIndex);
    const toKonvaIndex = mapListIndexToKonvaIndex(dropListIndex);

    onMoveLayer(fromKonvaIndex, toKonvaIndex);
  };

  // Selection handlers
  const handleSelect = (listIndex: number) => {
    onSelectLayer(mapListIndexToKonvaIndex(listIndex));
  };

  const handleRemove = (listIndex: number) => {
    const konvaIndex = mapListIndexToKonvaIndex(listIndex);
    onRemoveLayer(konvaIndex);
  };

  // Visibility and lock handlers
  const handleToggleLock = (listIndex: number) => {
    const konvaIndex = mapListIndexToKonvaIndex(listIndex);
    const layer = reversedLayers[listIndex];
    onDefinitionChange(konvaIndex, { locked: !layer.locked });
  };

  const handleToggleVisibility = (listIndex: number) => {
    const konvaIndex = mapListIndexToKonvaIndex(listIndex);
    const layer = reversedLayers[listIndex];
    const currentVisibility = layer.props.visible ?? true;
    onDefinitionChange(konvaIndex, {
      props: { ...layer.props, visible: !currentVisibility }
    } as Partial<KonvaNodeDefinition>);
  };

  // Bulk selection handlers
  const handleBulkToggle = (listIndex: number) => {
    const konvaIndex = mapListIndexToKonvaIndex(listIndex);
    setBulkSelectedIndices(prev =>
      prev.includes(konvaIndex)
        ? prev.filter(i => i !== konvaIndex)
        : [...prev, konvaIndex]
    );
  };

  const handleSelectAll = () => {
    setBulkSelectedIndices(layers.map((_, i) => i));
  };

  const handleDeselectAll = () => {
    setBulkSelectedIndices([]);
  };

  // Bulk operations
  const areAllSelectedVisible = bulkSelectedIndices.every(index => {
    const layer = layers[index];
    return layer && layer.props && layer.props.visible !== false;
  });

  const areAllSelectedLocked = bulkSelectedIndices.every(index => {
    const layer = layers[index];
    return layer && layer.locked === true;
  });

  const handleBulkToggleVisibility = () => {
    const newValue = !areAllSelectedVisible;
    bulkSelectedIndices.forEach(index => {
      const layer = layers[index];
      if (layer && layer.props) {
        onDefinitionChange(index, {
          props: { ...layer.props, visible: newValue }
        } as Partial<KonvaNodeDefinition>);
      }
    });
  };

  const handleBulkToggleLock = () => {
    const newValue = !areAllSelectedLocked;
    bulkSelectedIndices.forEach(index => {
      const layer = layers[index];
      if (layer) {
        onDefinitionChange(index, { locked: newValue });
      }
    });
  };

  const handleBulkDeleteAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Layers',
      message: `Are you sure you want to delete ${bulkSelectedIndices.length} layer(s)? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: () => {
        // Sort in descending order to maintain correct indices during deletion
        const sortedIndices = [...bulkSelectedIndices].sort((a, b) => b - a);
        sortedIndices.forEach(index => {
          onRemoveLayer(index);
        });
        setBulkSelectedIndices([]);
      }
    });
  };

  const handleBulkGroup = () => {
    if (onCreateGroup && bulkSelectedIndices.length > 0) {
      const groupName = prompt("Enter group name:", "New Group");
      if (groupName) {
        onCreateGroup(groupName, bulkSelectedIndices);
        setBulkSelectedIndices([]);
      }
    }
  };

  // Group handlers
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        onGroupChange?.(groupId, { expanded: false });
      } else {
        next.add(groupId);
        onGroupChange?.(groupId, { expanded: true });
      }
      return next;
    });
  };

  const handleGroupVisibilityToggle = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group && onGroupChange) {
      onGroupChange(groupId, { visible: !group.visible });
      // Also update all layers in the group
      layers.forEach((layer, index) => {
        if (layer.groupId === groupId) {
          onDefinitionChange(index, {
            props: { ...layer.props, visible: !group.visible }
          } as Partial<KonvaNodeDefinition>);
        }
      });
    }
  };

  const handleGroupLockToggle = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group && onGroupChange) {
      onGroupChange(groupId, { locked: !group.locked });
      // Also update all layers in the group
      layers.forEach((layer, index) => {
        if (layer.groupId === groupId) {
          onDefinitionChange(index, { locked: !group.locked });
        }
      });
    }
  };

  const handleGroupDelete = (groupId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Group',
      message: 'Are you sure you want to delete this group? Layers will be ungrouped but not deleted.',
      variant: 'warning',
      onConfirm: () => {
        // Ungroup all layers
        layers.forEach((layer, index) => {
          if (layer.groupId === groupId) {
            onDefinitionChange(index, { groupId: undefined });
          }
        });
        onDeleteGroup?.(groupId);
      }
    });
  };

  // Organize layers by groups
  const layersByGroup = useMemo(() => {
    const ungrouped: typeof reversedLayers = [];
    const grouped: Record<string, typeof reversedLayers> = {};

    reversedLayers.forEach((layer, listIndex) => {
      if (layer.groupId && groups.some(g => g.id === layer.groupId)) {
        if (!grouped[layer.groupId]) {
          grouped[layer.groupId] = [];
        }
        grouped[layer.groupId].push(layer);
      } else {
        ungrouped.push(layer);
      }
    });

    return { ungrouped, grouped };
  }, [reversedLayers, groups]);

  return (
    <div className="flex-1 h-full bg-white flex flex-col gap-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Search Bar */}
        <div className="pt-2 bg-white">
          <LayerSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
          />
        </div>

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedCount={bulkSelectedIndices.length}
          isAllVisible={areAllSelectedVisible}
          isAllLocked={areAllSelectedLocked}
          onToggleVisibility={handleBulkToggleVisibility}
          onToggleLock={handleBulkToggleLock}
          onDeleteAll={handleBulkDeleteAll}
          onGroupSelected={onCreateGroup ? handleBulkGroup : undefined}
        />

        {/* Select All / Deselect All */}
        {layers.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50/50">
            <button
              onClick={bulkSelectedIndices.length === layers.length ? handleDeselectAll : handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {bulkSelectedIndices.length === layers.length ? "Deselect All" : "Select All"}
            </button>
          </div>
        )}

        {/* Layers List */}
        <div className="space-y-1 px-4 py-2">
          {/* Render Groups */}
          {groups.map(group => {
            const groupLayers = layersByGroup.grouped[group.id] || [];
            const isExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id} className="mb-2">
                {/* Group Header */}
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-150 border border-gray-200 group">
                  <button
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="p-0.5 hover:bg-gray-200 rounded text-gray-500"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Folder className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="flex-1 font-medium text-sm text-gray-700">{group.name}</span>
                  <span className="text-xs text-gray-400">({groupLayers.length})</span>

                  {/* Group Controls - Visible on Hover */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleGroupVisibilityToggle(group.id)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                      title={group.visible ? "Hide group" : "Show group"}
                    >
                      {group.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleGroupLockToggle(group.id)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                      title={group.locked ? "Unlock group" : "Lock group"}
                    >
                      {group.locked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleGroupDelete(group.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      title="Delete group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Group Layers */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {groupLayers.map((layer) => {
                      const listIndex = reversedLayers.indexOf(layer);
                      const konvaIndex = mapListIndexToKonvaIndex(listIndex);
                      const isSelected = selectedIndex === konvaIndex;
                      const isBulkSelected = bulkSelectedIndices.includes(konvaIndex);
                      const isLocked = layer.locked ?? false;
                      const isVisible = layer.props.visible ?? true;

                      return renderLayerItem(layer, listIndex, konvaIndex, isSelected, isBulkSelected, isLocked, isVisible);
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Render Ungrouped Layers */}
          {layersByGroup.ungrouped.map((layer) => {
            const listIndex = reversedLayers.indexOf(layer);
            const konvaIndex = mapListIndexToKonvaIndex(listIndex);
            const isSelected = selectedIndex === konvaIndex;
            const isBulkSelected = bulkSelectedIndices.includes(konvaIndex);
            const isLocked = layer.locked ?? false;
            const isVisible = layer.props.visible ?? true;

            // Apply search filter
            if (searchQuery || filterType !== "all") {
              if (!filteredLayers.includes(layer)) {
                return null;
              }
            }

            return renderLayerItem(layer, listIndex, konvaIndex, isSelected, isBulkSelected, isLocked, isVisible);
          })}
        </div>

        {layers.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-gray-400">
            <Layers className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-center text-sm">
              No layers yet.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  );

  // Helper function to render a layer item
  function renderLayerItem(
    layer: KonvaNodeDefinition,
    listIndex: number,
    konvaIndex: number,
    isSelected: boolean,
    isBulkSelected: boolean,
    isLocked: boolean,
    isVisible: boolean
  ) {
    return (
      <div
        key={layer.id}
        draggable={!isLocked}
        onClick={() => handleSelect(listIndex)}
        onDragStart={() => handleDragStart(listIndex)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, listIndex)}
        onDragEnd={() => setDraggedListIndex(null)}
        className={`group relative p-2.5 rounded-lg text-sm cursor-pointer border transition-all duration-200 ${isSelected
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : draggedListIndex === listIndex
            ? "bg-gray-100 border-gray-300"
            : isBulkSelected
              ? "bg-blue-50/50 border-blue-100"
              : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
          } ${isLocked ? "opacity-75" : ""}`}
      >
        <div className="flex justify-between items-center gap-3">
          {/* Bulk Selection Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBulkToggle(listIndex);
            }}
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isBulkSelected
              ? "bg-blue-600 border-blue-600"
              : "border-gray-300 hover:border-blue-400 bg-white"
              }`}
          >
            {isBulkSelected && <Check className="w-3 h-3 text-white" />}
          </button>

          {/* Layer Icon & Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Simple Icon based on type */}
            {layer.type === 'Text' && <span className="text-gray-400"><Type size={14} /></span>}
            {layer.type === 'Image' && <span className="text-gray-400"><ImageIcon size={14} /></span>}
            {['Rect', 'Circle', 'Star'].includes(layer.type) && <span className="text-gray-400"><Move size={14} /></span>}

            <span className={`font-medium truncate ${isLocked ? "italic text-gray-500" : "text-gray-700"}`}>
              {getLayerName(layer)}
            </span>
          </div>

          {/* Control Buttons - Cleaner, Lucide Icons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleVisibility(listIndex);
              }}
              className={`p-1.5 rounded-md transition-colors ${!isVisible ? 'text-gray-400 bg-gray-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
              title={isVisible ? "Hide Layer" : "Show Layer"}
            >
              {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLock(listIndex);
              }}
              className={`p-1.5 rounded-md transition-colors ${isLocked ? 'text-red-400 bg-red-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
              title={isLocked ? "Unlock Layer" : "Lock Layer"}
            >
              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(listIndex);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove Layer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Depth Indicator (Subtle) */}
        {(listIndex === 0 || listIndex === layers.length - 1) && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-transparent">
            {listIndex === 0 && <div className="h-full bg-blue-400/50 w-full" title="Front" />}
            {listIndex === layers.length - 1 && <div className="h-full bg-red-400/50 w-full" title="Back" />}
          </div>
        )}
      </div>
    );
  }
}