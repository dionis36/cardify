// components/editor/TextNode.tsx (UPGRADED)

"use client";

import React, { useRef, memo } from "react";
import { Text } from "react-konva";
import Konva from "konva";
import { TextProps, KonvaNodeDefinition } from "@/types/template";

interface TextNodeProps {
  node: KonvaNodeDefinition & { type: "Text"; props: TextProps };
  nodeRef?: React.RefObject<Konva.Text>; // Added prop
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onNodeChange: (updates: Partial<TextProps>) => void;
  isLocked: boolean;
  isLayoutDisabled: boolean;
  // NEW PROP: Callback to tell the parent (CanvasStage) to show the HTML editor
  onStartEditing: (konvaNode: Konva.Text) => void;
  // NEW PROP: Flag from parent to hide the Konva node when the HTML editor is active
  isVisible?: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}

const TextNode: React.FC<TextNodeProps> = memo((({
  node,
  nodeRef, // Destructure
  isSelected,
  onSelect,
  onDeselect,
  onNodeChange,
  isLocked,
  isLayoutDisabled,
  onStartEditing, // Destructure new prop
  isVisible = true, // Destructure new prop with default
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}) => {
  const internalRef = useRef<Konva.Text>(null);
  const konvaNodeRef = nodeRef || internalRef;

  // Destructure Konva properties and safely handle optional props
  const {
    text, fontSize, fontFamily, fill, x, y, width, height, rotation, opacity, visible,
    align, lineHeight, letterSpacing, textDecoration, fontStyle,
    shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
  } = node.props;

  // Provide safe defaults for text styles
  const isBold = fontStyle?.includes('bold') ? 'bold' : 'normal';
  const isItalic = fontStyle?.includes('italic') ? 'italic' : 'normal';
  const decoration = textDecoration || '';
  const safeAlign = align || 'left';
  const safeVisible = visible ?? true; // Default to true if not set

  // --- Double-click handler to initiate inline editing ---
  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Prevent event from bubbling up to the stage/layer
    e.cancelBubble = true;

    // Do not allow editing if locked or layout is disabled
    if (isLocked || isLayoutDisabled || !node.editable) return;

    const konvaNode = konvaNodeRef.current;

    if (konvaNode) {
      // Stop selection and pass the Konva node instance back to the parent
      onDeselect();
      onStartEditing(konvaNode);
    }
  };

  // --- Handle transformations (scaling, rotation) ---
  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const konvaNode = konvaNodeRef.current;
    if (!konvaNode) return;

    // We reset scale and update the Konva properties (width/height/rotation) in state
    const scaleX = konvaNode.scaleX();
    const scaleY = konvaNode.scaleY();

    konvaNode.scaleX(1);
    konvaNode.scaleY(1);

    onNodeChange({
      x: konvaNode.x(),
      y: konvaNode.y(),
      // Max(5, ...) prevents accidental zero-sized nodes
      width: Math.max(5, konvaNode.width() * scaleX),
      height: Math.max(5, konvaNode.height() * scaleY),
      rotation: konvaNode.rotation(),
    });
  };

  // Render null when the parent is showing the HTML editor overlay
  if (!isVisible) {
    return null;
  }

  // Konva Text Node component
  return (
    <Text
      key={node.id}
      ref={konvaNodeRef}
      id={node.id}
      x={x}
      y={y}
      width={width}
      height={height}
      text={text}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fill={fill}
      rotation={rotation}
      opacity={opacity}
      visible={safeVisible}
      draggable={!isLocked && !isLayoutDisabled && node.editable}

      // Selection Handlers
      onClick={onSelect}
      onTap={onSelect}

      // Editing Handler (calls parent)
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}

      // Drag & Transform Handlers
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        onDragEnd?.(e);
        onNodeChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={handleTransformEnd}

      // Advanced Text Properties
      align={safeAlign}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      textDecoration={decoration}
      fontStyle={`${isBold} ${isItalic}`}

      // Shadow Props
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffsetX={shadowOffsetX}
      shadowOffsetY={shadowOffsetY}
    />
  );
}));

TextNode.displayName = "TextNode";
export default TextNode;