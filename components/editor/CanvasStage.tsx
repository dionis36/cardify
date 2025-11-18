// components/editor/CanvasStage.tsx (MODIFIED - Fixing Text Node Transformer Visibility)

"use client";

import React, { forwardRef, useRef, useEffect, useCallback, memo, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps, RectProps, ImageProps, TextProps } from "@/types/template"; 
import KonvaNodeRenderer from "./KonvaNodeRenderer";
import { Stage as KonvaStageType } from "konva/lib/Stage";

// NEW IMPORTS for Snapping
import { getSnappingLines, getSnapAndAlignLines, SnappingLine } from "@/lib/alignmentHelpers";
import TextEditor from "./TextEditor"; // Import the TextEditor component for Phase 2.1

/**
 * Define print-production constants in pixels.
 */
const BLEED_MARGIN = 15;
const SAFE_MARGIN = 15; 

// Simple image cache 
const imageCache: Record<string, HTMLImageElement> = {};

// ... (useCachedImage hook remains here) ...
function useCachedImage(src?: string | null) {
    const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  
    useEffect(() => {
      if (!src) {
        setImage(undefined);
        return;
      }
      
      // Check cache first
      if (imageCache[src]) {
        setImage(imageCache[src]);
        return;
      }
  
      // Load image
      const img = new Image();
      img.crossOrigin = 'Anonymous'; 
      img.src = src;
  
      const handleLoad = () => {
        imageCache[src] = img;
        setImage(img);
      };
  
      img.addEventListener('load', handleLoad);
      return () => {
        img.removeEventListener('load', handleLoad);
      };
    }, [src]);
  
    return image;
}
// ... (end useCachedImage hook) ...

type EditorMode = "FULL_EDIT" | "DATA_ONLY";

interface CanvasStageProps {
    template: CardTemplate;
    selectedNodeIndex: number | null;
    onNodeChange: (index: number, updates: Partial<KonvaNodeProps>) => void;
    onSelectNode: (index: number | null) => void;  // Changed: removed event parameter
    onDeselectNode: () => void; // Added for clarity
    mode: EditorMode;
}

type StageRef = KonvaStageType | null;

const CanvasStage = forwardRef<StageRef, CanvasStageProps>((({
    template,
    selectedNodeIndex,
    onNodeChange,
    onSelectNode,
    onDeselectNode, // Use the new prop
    mode,
}, ref) => {
    const transformerRef = useRef<Konva.Transformer>(null);
    const stageRef = useRef<Konva.Stage>(null);
    
    // Snapping State (Phase 2.2)
    const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);
    const [visibleSnappingLines, setVisibleSnappingLines] = useState<SnappingLine[]>([]);
    
    // Inline Text Editing State (Phase 2.1)
    const [editingNode, setEditingNode] = useState<{
        konvaNode: Konva.Text; 
        nodeDef: KonvaNodeDefinition & { type: 'Text', props: TextProps };
        index: number;
    } | null>(null);

    const isLayoutDisabled = mode === "DATA_ONLY";

    // ---------------------- 2.1 INLINE TEXT EDITING HANDLERS ----------------------
    const handleStartTextEditing = useCallback((konvaNode: Konva.Text) => {
        const index = template.layers.findIndex(
            (node) => node.id === konvaNode.id()
        );
        
        if (index === -1 || template.layers[index].type !== 'Text' || template.layers[index].locked) return;
        
        // 1. Deselect other nodes
        onSelectNode(null)
        
        // 2. Set the state to start editing
        setEditingNode({
            konvaNode,
            nodeDef: template.layers[index] as KonvaNodeDefinition & { type: 'Text', props: TextProps },
            index,
        });

    }, [template.layers, onSelectNode]);


    const handleStopTextEditing = useCallback((newText: string) => {
        if (!editingNode) return;

        // 1. Commit the text change
        onNodeChange(editingNode.index, { text: newText });

        // 2. Clear editing state
        setEditingNode(null);
    }, [editingNode, onNodeChange]);

    // ---------------------- 2.2 SNAPPING/DRAGGING HANDLERS ----------------------

    const handleDragStart = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const id = e.target.id();
        const index = template.layers.findIndex((node) => node.id === id);
        
        if (index !== -1 && !template.layers[index].locked) {
            setDraggedNodeIndex(index);
        }
    }, [template.layers]);


    const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (draggedNodeIndex === null) return;
        
        const draggedKonvaNode = e.target as Konva.Node;
        const draggedNodeDef = template.layers[draggedNodeIndex];

        // Ensure we only snap editable, non-locked nodes
        if (draggedNodeDef.locked || !draggedNodeDef.editable) {
            return;
        }

        // 1. Get current (unsnapped) properties of the dragged node
        const currentProps: KonvaNodeProps = {
            x: draggedKonvaNode.x(),
            y: draggedKonvaNode.y(),
            width: draggedKonvaNode.width() * draggedKonvaNode.scaleX(),
            height: draggedKonvaNode.height() * draggedKonvaNode.scaleY(),
            rotation: draggedKonvaNode.rotation(),
            opacity: draggedNodeDef.props.opacity, // Just need common props for snapping calculation
        } as KonvaNodeProps; 
        
        // 2. Calculate all potential snapping targets (from other nodes + canvas)
        const allSnappingLines = getSnappingLines(
            template.layers, 
            draggedNodeIndex, 
            template.width, 
            template.height
        );

        // 3. Find the best snap location
        const { x: newX, y: newY, snappingLines: guidesToDisplay } = getSnapAndAlignLines(
            currentProps, 
            allSnappingLines
        );

        // 4. Apply the snapped position
        draggedKonvaNode.x(newX);
        draggedKonvaNode.y(newY);

        // 5. Update state for visualization
        setVisibleSnappingLines(guidesToDisplay);

    }, [draggedNodeIndex, template.layers, template.width, template.height]);


    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (draggedNodeIndex === null) return;

        const draggedKonvaNode = e.target as Konva.Node;

        // 1. Commit the final snapped position
        onNodeChange(draggedNodeIndex, {
            x: draggedKonvaNode.x(),
            y: draggedKonvaNode.y(),
        });
        
        // 2. Clear snapping states
        setVisibleSnappingLines([]);
        setDraggedNodeIndex(null);

    }, [draggedNodeIndex, onNodeChange]);

    // ---------------------- 3. SIDE EFFECTS/LIFECYCLE ----------------------

    // Attach transformer to selected node
    useEffect(() => {
        if (!stageRef.current || !transformerRef.current) return;
        
        // FIX: If a node is being edited with the HTML TextEditor, do not attach the transformer.
        if (editingNode !== null) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
            return;
        }

        const transformer = transformerRef.current;
        const selectedNode = selectedNodeIndex !== null
            ? stageRef.current.findOne(`#${template.layers[selectedNodeIndex].id}`)
            : null;

        if (selectedNode) {
            // Check if the node is transformable and not locked
            const selectedDef = template.layers[selectedNodeIndex!];
            if (selectedDef.editable && !selectedDef.locked) {
                // This now attaches to Text nodes as well, allowing resizing.
                transformer.nodes([selectedNode as Konva.Node]);
            } else {
                transformer.nodes([]);
            }
        } else {
            transformer.nodes([]);
        }
        
        // Redraw layer to make transformer visible
        transformer.getLayer()?.batchDraw();

    // ADD editingNode to dependencies to trigger detachment when editing starts.
    }, [selectedNodeIndex, template.layers, editingNode]); 

    // Expose Konva Stage methods via ref
    React.useImperativeHandle(ref, () => stageRef.current as KonvaStageType, []);

    // ---------------------- 4. RENDER ----------------------
    
    // The node definition that is currently selected (for passing to TextEditor)
    const selectedNodeDef = selectedNodeIndex !== null ? template.layers[selectedNodeIndex] : null;

    return (
        <div className="relative" style={{ width: template.width, height: template.height }}>
            {/* 2.1: Render the HTML Text Editor on top of the canvas */}
            {editingNode && (
                <TextEditor
                    nodeDef={editingNode.nodeDef}
                    konvaNode={editingNode.konvaNode}
                    canvasStageRef={stageRef}
                    onStopEditing={handleStopTextEditing}
                />
            )}

            <Stage 
                ref={stageRef}
                width={template.width} 
                height={template.height}
                // Handle deselecting on click outside of a node
                onClick={(e) => {
                    // FIX: Always clear editing state on ANY click that bubbles up to the stage
                    setEditingNode(null);

                    // Only deselect everything if the click hit the stage background
                    if (e.target === e.target.getStage()) {
                        onDeselectNode(); // Use the dedicated deselect handler
                    }
                }}
            >
                <Layer>
                    {/* 1. BACKGROUND RECT (The card itself) */}
                    <Rect 
                        width={template.width} 
                        height={template.height}
                        fill="#FFFFFF" // Default white background
                        listening={true} // Must be listening for stage click/tap to work
                    />
                    
                    {/* 2. SAFE/BLEED MARGINS (Visual Guides - Not Exported) */}
                    {/* Bleed Margin (Red Outline) */}
                    <Rect
                        x={0} y={0} 
                        width={template.width} 
                        height={template.height}
                        stroke="#ef4444" // Tailwind red-500
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                    />
                    {/* Safe Margin (Blue Outline) */}
                    <Rect
                        x={SAFE_MARGIN} y={SAFE_MARGIN}
                        width={template.width - 2 * SAFE_MARGIN}
                        height={template.height - 2 * SAFE_MARGIN}
                        stroke="#3b82f6" // Tailwind blue-500
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                    />

                    {/* 3. MAIN CONTENT GROUP */}
                    <Group>
                        {template.layers.map((nodeDef, index) => {
                            // Check if this node is currently being edited
                            const isBeingEdited = editingNode?.index === index;
                            
                            return (
                                <KonvaNodeRenderer 
                                    key={nodeDef.id}
                                    node={nodeDef}
                                    index={index}
                                    isSelected={selectedNodeIndex === index}
                                    onSelect={(indexValue) => { 
                                    onSelectNode(indexValue)
                                    }}
                                    onNodeChange={(indexValue, updates) => onNodeChange(indexValue, updates)}
                                    isLocked={nodeDef.locked}
                                    isLayoutDisabled={isLayoutDisabled}
                                    onStartEditing={handleStartTextEditing}
                                    isVisible={!isBeingEdited}
                                    onDragStart={handleDragStart}
                                    onDragMove={handleDragMove}
                                    onDragEnd={handleDragEnd}
                                />
                            );
                        })}
                    </Group>

                    {/* 4. SNAPPING LINES (Phase 2.2) */}
                    {visibleSnappingLines.map((line, index) => {
                        // Calculate dimensions for a thin line (1px wide or high)
                        const isVertical = line.guideType === "v";
                        const lineProps = isVertical
                            ? {
                                x: line.lineCoord,
                                y: 0,
                                width: 1,
                                height: template.height,
                            }
                            : {
                                x: 0,
                                y: line.lineCoord,
                                width: template.width,
                                height: 1,
                            };
                            
                        return (
                            <Rect
                                key={index}
                                {...lineProps}
                                fill={line.strokeColor}
                                listening={false}
                            />
                        );
                    })}

                    {/* 5. TRANSFORMER - FIX: Only hide the transformer when the TextEditor is actively open */}
                    {editingNode === null && (
                        <Transformer
                            ref={transformerRef}
                            enabledAnchors={[
                                'top-left', 'top-right', 'bottom-left', 'bottom-right', 
                                'middle-left', 'middle-right', 'top-center', 'bottom-center'
                            ]}
                            rotationSnaps={[0, 90, 180, 270]}
                            // Disable drag/transform in data-only mode or if locked
                            visible={!isLayoutDisabled && !!selectedNodeDef && !selectedNodeDef.locked} 
                            boundBoxFunc={(oldBox, newBox) => {
                                const templateMaxX = template.width;
                                const templateMaxY = template.height;
                                
                                // Clamping logic (relative to the Group)
                                let x = Math.max(0, newBox.x);
                                let y = Math.max(0, newBox.y);

                                if (x + newBox.width > templateMaxX) {
                                    x = templateMaxX - newBox.width;
                                }
                                if (y + newBox.height > templateMaxY) {
                                    y = templateMaxY - newBox.height;
                                }

                                if (newBox.width < 10 || newBox.height < 10) {
                                    return oldBox;
                                }
                                
                                return { x, y, width: newBox.width, height: newBox.height, rotation: newBox.rotation };
                            }}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
}));

CanvasStage.displayName = "CanvasStage";
export default CanvasStage;