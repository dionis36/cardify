// components/editor/KonvaNodeRenderer.tsx (The Dispatcher)

"use client";

import React, { useRef, memo } from "react";
import { Rect } from "react-konva";
import Konva from "konva";
import { KonvaNodeDefinition, KonvaNodeProps, RectProps, ImageProps, TextProps } from "@/types/template";
import TextNode from "./TextNode"; 
import ImageNode from "./ImageNode"; 

interface KonvaNodeRendererProps {
  node: KonvaNodeDefinition;
  index: number;
  isSelected: boolean;
  onSelect: (indexValue: number | null) => void;
  onNodeChange: (indexValue: number, updates: Partial<KonvaNodeProps>) => void;
  isLocked: boolean;
  isLayoutDisabled: boolean;
  onStartEditing: (konvaNode: Konva.Text) => void;
  onDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  isVisible: boolean;
}

const KonvaNodeRenderer: React.FC<KonvaNodeRendererProps> = memo(({
  node,
  index,
  isSelected,
  onSelect,
  onNodeChange,
  isLocked,
  isLayoutDisabled,
  onStartEditing,
  onDragStart,
  onDragMove,
  onDragEnd,
  isVisible,
}) => {
  
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onNodeChange(index, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleSelect = () => {
    onSelect(index);
  };
  
  const nodeChangeHandler = (updates: Partial<KonvaNodeProps>) => {
    onNodeChange(index, updates);
  }

  // Deselect when TextNode starts its inline editing state
  const handleTextDeselect = () => {
      onSelect(null);
  }

  // --- NODE TYPE DISPATCH ---

  if (node.type === "Text") {
    const textNode = node as KonvaNodeDefinition & { type: "Text"; props: TextProps };
    return (
      <TextNode 
        node={textNode}
        isSelected={isSelected}
        onSelect={handleSelect}
        onDeselect={handleTextDeselect}
        onNodeChange={updates => nodeChangeHandler(updates as Partial<KonvaNodeProps>)}
        isLocked={node.locked}
        isLayoutDisabled={isLayoutDisabled}
        onStartEditing={onStartEditing}
        isVisible={isVisible}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    );
  }

  if (node.type === "Rect") {
    const { x, y, width, height, rotation, opacity, visible, fill, stroke, strokeWidth, cornerRadius } = node.props as RectProps;
    const konvaNodeRef = useRef<Konva.Rect>(null);

    return (
      <Rect
        key={node.id}
        ref={konvaNodeRef}
        id={node.id}
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={rotation}
        opacity={opacity}
        visible={visible}
        fill={fill}
        stroke={stroke} 
        strokeWidth={strokeWidth}
        cornerRadius={cornerRadius}
        draggable={!node.locked && !isLayoutDisabled && node.editable}
        onClick={handleSelect}
        onTap={handleSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd(e);
          handleDragEnd(e);
        }}
      />
    );
  }
  
  if (node.type === "Image") {
    const imageNode = node as KonvaNodeDefinition & { type: "Image"; props: ImageProps };
    
    return (
      <ImageNode
        node={imageNode}
        isSelected={isSelected}
        onSelect={handleSelect}
        onNodeChange={updates => nodeChangeHandler(updates as Partial<KonvaNodeProps>)}
        isLocked={node.locked}
        isLayoutDisabled={isLayoutDisabled}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    );
  }

  return null;
});

KonvaNodeRenderer.displayName = "KonvaNodeRenderer";
export default KonvaNodeRenderer;