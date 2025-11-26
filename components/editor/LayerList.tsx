// components/editor/LayerList.tsx (ENHANCED - Groups, Search, Bulk Operations)

"use client";

import { KonvaNodeDefinition, LayerGroup, KonvaNodeType } from "@/types/template";
import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Eye, EyeOff, Lock, Unlock, Trash2, Folder, FolderOpen, Check } from "lucide-react";
import LayerSearchBar from "./LayerSearchBar";
import BulkActionsToolbar from "./BulkActionsToolbar";

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
  const handleBulkShowAll = () => {
    bulkSelectedIndices.forEach(index => {
      onDefinitionChange(index, {
        props: { ...layers[index].props, visible: true }
      } as Partial<KonvaNodeDefinition>);
    });
  };

  const handleBulkHideAll = () => {
    bulkSelectedIndices.forEach(index => {
      onDefinitionChange(index, {
        props: { ...layers[index].props, visible: false }
      } as Partial<KonvaNodeDefinition>);
    });
  };

  const handleBulkLockAll = () => {
    bulkSelectedIndices.forEach(index => {
      onDefinitionChange(index, { locked: true });
    });
  };

  const handleBulkUnlockAll = () => {
    bulkSelectedIndices.forEach(index => {
      onDefinitionChange(index, { locked: false });
    });
  };

  const handleBulkDeleteAll = () => {
    if (confirm(`Delete ${bulkSelectedIndices.length} layer(s)?`)) {
      // Sort in descending order to maintain correct indices during deletion
      const sortedIndices = [...bulkSelectedIndices].sort((a, b) => b - a);
      sortedIndices.forEach(index => {
        onRemoveLayer(index);
      });
      setBulkSelectedIndices([]);
    }
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
    if (confirm("Delete this group? (Layers will be ungrouped)")) {
      // Ungroup all layers
      layers.forEach((layer, index) => {
        if (layer.groupId === groupId) {
          onDefinitionChange(index, { groupId: undefined });
        }
      });
      onDeleteGroup?.(groupId);
    }
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
      <h2 className="font-semibold text-lg border-b border-gray-200 pb-3 px-4 pt-2 text-gray-800 shrink-0">
        Layers ({layers.length})
      </h2>

      {/* Search Bar */}
      <LayerSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkSelectedIndices.length}
        onShowAll={handleBulkShowAll}
        onHideAll={handleBulkHideAll}
        onLockAll={handleBulkLockAll}
        onUnlockAll={handleBulkUnlockAll}
        onDeleteAll={handleBulkDeleteAll}
        onGroupSelected={onCreateGroup ? handleBulkGroup : undefined}
      />

      {/* Select All / Deselect All */}
      {layers.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 shrink-0">
          <button
            onClick={bulkSelectedIndices.length === layers.length ? handleDeselectAll : handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {bulkSelectedIndices.length === layers.length ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

      {/* Layers List */}
      <div className="space-y-1 flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {/* Render Groups */}
        {groups.map(group => {
          const groupLayers = layersByGroup.grouped[group.id] || [];
          const isExpanded = expandedGroups.has(group.id);

          return (
            <div key={group.id} className="mb-2">
              {/* Group Header */}
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-150 border border-gray-200">
                <button
                  onClick={() => toggleGroupExpansion(group.id)}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-600" />
                )}
                <span className="flex-1 font-medium text-sm text-gray-700">{group.name}</span>
                <span className="text-xs text-gray-500">({groupLayers.length})</span>

                {/* Group Controls */}
                <button
                  onClick={() => handleGroupVisibilityToggle(group.id)}
                  className="p-1 rounded hover:bg-gray-200"
                  title={group.visible ? "Hide group" : "Show group"}
                >
                  {group.visible ? (
                    <Eye className="w-3.5 h-3.5 text-gray-600" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleGroupLockToggle(group.id)}
                  className="p-1 rounded hover:bg-gray-200"
                  title={group.locked ? "Unlock group" : "Lock group"}
                >
                  {group.locked ? (
                    <Lock className="w-3.5 h-3.5 text-gray-600" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleGroupDelete(group.id)}
                  className="p-1 rounded hover:bg-red-100 text-red-500"
                  title="Delete group"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-center text-gray-500 text-sm">
            This page has no layers.
          </p>
        </div>
      )}
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
        className={`p-2 rounded text-sm cursor-pointer border transition-all duration-150 ${isSelected
            ? "bg-blue-100 border-blue-500 ring-2 ring-blue-500"
            : draggedListIndex === listIndex
              ? "bg-gray-200 border-gray-400"
              : isBulkSelected
                ? "bg-blue-50 border-blue-300"
                : "bg-white border-gray-200 hover:bg-gray-100"
          } ${isLocked ? "opacity-70" : "hover:shadow-sm"}`}
      >
        <div className="flex justify-between items-center gap-2">
          {/* Bulk Selection Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBulkToggle(listIndex);
            }}
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isBulkSelected
                ? "bg-blue-600 border-blue-600"
                : "border-gray-300 hover:border-blue-400"
              }`}
          >
            {isBulkSelected && <Check className="w-3 h-3 text-white" />}
          </button>

          {/* Layer Name */}
          <span className={`font-medium truncate flex-1 ${isLocked ? "italic text-gray-500" : "text-gray-700"}`}>
            {getLayerName(layer)}
          </span>

          {/* Control Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleVisibility(listIndex);
              }}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 text-sm"
              title={isVisible ? "Hide Layer" : "Show Layer"}
            >
              {isVisible ? "👁️" : "🚫"}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLock(listIndex);
              }}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 text-sm"
              title={isLocked ? "Unlock Layer" : "Lock Layer"}
            >
              {isLocked ? "🔒" : "🔓"}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(listIndex);
              }}
              className="p-1 rounded hover:bg-red-100 text-red-500 text-sm"
              title="Remove Layer"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Depth Indicator */}
        <p className="text-xs text-gray-400 mt-0.5">
          {listIndex === 0 && <span className="text-blue-500">Front (Top)</span>}
          {listIndex === layers.length - 1 && <span className="text-red-500">Back (Bottom)</span>}
        </p>
      </div>
    );
  }
}