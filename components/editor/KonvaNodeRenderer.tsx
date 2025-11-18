// components/editor/KonvaNodeRenderer.tsx (MODIFIED - Adding onTransformEnd)

"use client";

import React, { useRef, memo } from "react";
// ADDED IMPORTS for new shapes
import { Rect, Circle, Ellipse, Star, RegularPolygon, Line, Arrow, Path } from "react-konva"; 
import Konva from "konva";
import { 
  KonvaNodeDefinition, 
  KonvaNodeProps, 
  RectProps, 
  ImageProps, 
  TextProps,
  CircleProps,
  EllipseProps,
  StarProps,
  RegularPolygonProps,
  LineProps,
  ArrowProps,
  PathProps
} from "@/types/template"; // Assuming these types are correctly defined
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
  // NEW PROP ADDED FOR TRANSFORM LISTENING
  // onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void; 
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
  // onTransformEnd,
  isVisible,
}) => {
  
  // NOTE: We no longer need this handleDragEnd here, as it's handled by the 
  // onNodeDragEnd passed from CanvasStage which also handles snapping cleanup.
  /*
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onNodeChange(index, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };
  */

  const handleSelect = () => {
    // Only allow selection if the node is editable
    if (node.editable) { 
        onSelect(index);
    }
  };
  
  const nodeChangeHandler = (updates: Partial<KonvaNodeProps>) => {
    onNodeChange(index, updates);
  }

  // Deselect when TextNode starts its inline editing state
  const handleTextDeselect = () => {
      onSelect(null);
  }

  // Common props for all shapes
  const commonKonvaProps = {
    key: node.id,
    name: node.type, // Ensure type is used for center-based shape detection
    draggable: !node.locked && !isLayoutDisabled && node.editable,
    onClick: handleSelect,
    onTap: handleSelect,
    onDragStart: onDragStart,
    onDragMove: onDragMove,
    // Pass the main onDragEnd handler for Konva events
    onDragEnd: onDragEnd, 
    // ADD THE TRANSFORM HANDLER
    // onTransformEnd: onTransformEnd,
    
    ...node.props, // Spread all properties
  };


  // --- NODE TYPE DISPATCH ---

  // 1. Text (Uses external component)
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
        // NOTE: TextNode will need to explicitly pass this down to the Konva Text component if it manages it internally
        // Assuming TextNode handles its own transform end or is simple enough to rely on wrapper props.
      />
    );
  }

  // 2. Rect 
  if (node.type === "Rect") {
    const { x, y, width, height, rotation, opacity, fill, stroke, strokeWidth, cornerRadius } = node.props as RectProps;
    const konvaNodeRef = useRef<Konva.Rect>(null);

    return (
      <Rect
        ref={konvaNodeRef}
        {...commonKonvaProps}
        x={x} y={y} width={width} height={height} rotation={rotation} opacity={opacity}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={cornerRadius}
      />
    );
  }
  
  // 3. Image (Uses external component)
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
        // ImageNode will also need to pass onTransformEnd to its internal Konva Image
      />
    );
  }
  
  // 4. Circle (NEW SHAPE - uses center point)
  if (node.type === "Circle") {
    // We use node.props for radius, but we calculate the Konva x/y center based on state's x/y (top-left) and width/height
    const { x, y, width, height, rotation, opacity, fill, stroke, strokeWidth, radius } = node.props as CircleProps;
    
    return (
        <Circle
            {...commonKonvaProps}
            x={x + width / 2} 
            y={y + height / 2} 
            radius={radius}
            width={width} // Pass width/height to enable Konva Transformer to work correctly
            height={height}
            fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={rotation} opacity={opacity}
        />
    );
  }

  // 5. Ellipse (NEW SHAPE - uses center point)
  if (node.type === "Ellipse") {
    const { x, y, width, height, rotation, opacity, fill, stroke, strokeWidth, radiusX, radiusY } = node.props as EllipseProps;
    
    return (
        <Ellipse
            {...commonKonvaProps}
            x={x + width / 2} 
            y={y + height / 2} 
            radiusX={radiusX} 
            radiusY={radiusY}
            width={width} // Pass width/height to enable Konva Transformer to work correctly
            height={height}
            fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={rotation} opacity={opacity}
        />
    );
  }

  // 6. Star (NEW SHAPE - uses center point)
  if (node.type === "Star") {
    const { x, y, width, height, rotation, opacity, fill, stroke, strokeWidth, numPoints, innerRadius, outerRadius } = node.props as StarProps;
    
    return (
        <Star
            {...commonKonvaProps}
            x={x + width / 2} 
            y={y + height / 2} 
            numPoints={numPoints}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            width={width} // Pass width/height to enable Konva Transformer to work correctly
            height={height}
            fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={rotation} opacity={opacity}
        />
    );
  }

  // 7. RegularPolygon (NEW SHAPE - uses center point)
  if (node.type === "RegularPolygon") {
    const { x, y, width, height, rotation, opacity, fill, stroke, strokeWidth, sides, radius } = node.props as RegularPolygonProps;
    
    return (
        <RegularPolygon
            {...commonKonvaProps}
            x={x + width / 2} 
            y={y + height / 2} 
            sides={sides}
            radius={radius}
            width={width} // Pass width/height to enable Konva Transformer to work correctly
            height={height}
            fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={rotation} opacity={opacity}
        />
    );
  }

  // 8. Line (NEW SHAPE)
  if (node.type === "Line") {
    const { x, y, rotation, opacity, stroke, strokeWidth, points, tension } = node.props as LineProps;
    
    return (
        <Line
            {...commonKonvaProps}
            x={x} y={y} // Line uses x/y as offset, points define the shape
            points={points}
            tension={tension}
            stroke={stroke} strokeWidth={strokeWidth} rotation={rotation} opacity={opacity}
        />
    );
  }

  // 9. Arrow (NEW SHAPE)
  if (node.type === "Arrow") {
    const { x, y, rotation, opacity, stroke, strokeWidth, points } = node.props as ArrowProps;
    
    return (
        <Arrow
            {...commonKonvaProps}
            x={x} y={y} // Arrow uses x/y as offset, points define the shape
            points={points}
            stroke={stroke} strokeWidth={strokeWidth} rotation={rotation} opacity={opacity}
        />
    );
  }

  // 10. Path (NEW SHAPE)
  if (node.type === "Path") {
    const { x, y, width, height, rotation, opacity, fill, stroke, strokeWidth, data } = node.props as PathProps;
    
    return (
        <Path
            {...commonKonvaProps}
            x={x} y={y} width={width} height={height}
            data={data}
            fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={rotation} opacity={opacity}
        />
    );
  }


  // Fallback for unhandled types
  return null;
});

KonvaNodeRenderer.displayName = "KonvaNodeRenderer";
export default KonvaNodeRenderer;