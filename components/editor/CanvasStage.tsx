// components/editor/CanvasStage.tsx

"use client";

import React, { forwardRef, useRef, useEffect, useCallback, memo, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
// FIX: Using relative imports for local components/types
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps, KonvaNodeType, PathProps, BackgroundPattern, BackgroundType } from "../../types/template";
import KonvaNodeRenderer from "./KonvaNodeRenderer";
import { Stage as KonvaStageType } from "konva/lib/Stage";

// FIX: Using relative import for helper
import { getSnappingLines, getSnapAndAlignLines, SnappingLine } from "../../lib/alignmentHelpers";

/**
 * Define print-production constants in pixels.
 */
const BLEED_MARGIN = 15;
const SAFE_MARGIN = 15;
const STAGE_PADDING = 64; // CRITICAL: Padding value (p-8 in parent is 32px, 32*2 = 64px for safety margin on both sides/top/bottom)

// Simple image cache 
const imageCache: Record<string, HTMLImageElement> = {};

// --- Hooks for Assets (Moved here for single file mandate) ---

// Hook to load image asynchronously and cache it
function useCachedImage(src?: string | null) {
    const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

    useEffect(() => {
        if (!src) {
            setImage(undefined);
            return;
        }

        if (imageCache[src]) {
            setImage(imageCache[src]);
            return;
        }

        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            imageCache[src] = img;
            setImage(img);
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            setImage(undefined);
        };
        img.src = src;

        return () => {
            // Cleanup is mostly for preventing memory leaks if component unmounts mid-load
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    return image;
}

// --- Background Renderer (To keep the component clean) ---

interface BackgroundRendererProps {
    template: CardTemplate;
    background: BackgroundPattern;
}

const BackgroundRenderer: React.FC<BackgroundRendererProps> = memo(({ template, background }) => {
    const { width, height } = template;
    const {
        type,
        color1,
        color2,
        gradientType,
        gradientStops,
        opacity,
        rotation,
        scale,
        patternImageURL,
        overlayColor
    } = background;

    // Pattern Image Loading
    const patternImage = useCachedImage((type === 'pattern' || type === 'texture') ? patternImageURL : null);

    // 1. Base Layer (Solid Color)
    // Always render a base color. For gradients, this might be hidden or used as fallback.
    // For patterns/textures, this is the background color behind the transparent pattern.
    const renderBaseLayer = () => (
        <Rect
            x={0} y={0} width={width} height={height}
            fill={color1}
            listening={false}
        />
    );

    // 2. Main Effect Layer (Gradient or Pattern/Texture)
    const renderEffectLayer = () => {
        if (type === 'solid') return null;

        if (type === 'gradient') {
            const stops = gradientStops
                ? gradientStops.flatMap(s => [s.offset, s.color])
                : [0, color1, 1, color2 || '#ffffff'];

            let gradientProps: any = {};

            if (gradientType === 'radial') {
                gradientProps = {
                    fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
                    fillRadialGradientStartRadius: 0,
                    fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
                    fillRadialGradientEndRadius: Math.max(width, height) / 1.5, // Cover the area
                    fillRadialGradientColorStops: stops,
                };
            } else {
                // Linear Gradient Math
                // Calculate start/end points based on rotation
                const angleRad = (rotation || 0) * (Math.PI / 180);
                // Simple approximation for full coverage:
                // Center is (w/2, h/2). Vector is (cos, sin).
                // Start = Center - Vector * Length. End = Center + Vector * Length.
                const length = Math.sqrt(width * width + height * height) / 2;
                const cx = width / 2;
                const cy = height / 2;

                gradientProps = {
                    fillLinearGradientStartPoint: {
                        x: cx - Math.cos(angleRad) * length,
                        y: cy - Math.sin(angleRad) * length
                    },
                    fillLinearGradientEndPoint: {
                        x: cx + Math.cos(angleRad) * length,
                        y: cy + Math.sin(angleRad) * length
                    },
                    fillLinearGradientColorStops: stops,
                };
            }

            return (
                <Rect
                    x={0} y={0} width={width} height={height}
                    {...gradientProps}
                    listening={false}
                />
            );
        }

        if ((type === 'pattern' || type === 'texture') && patternImage) {
            return (
                <Rect
                    x={0} y={0} width={width} height={height}
                    fillPatternImage={patternImage}
                    fillPatternScaleX={scale}
                    fillPatternScaleY={scale}
                    fillPatternRotation={rotation}
                    fillPatternRepeat='repeat'
                    listening={false}
                />
            );
        }

        return null;
    };

    // 3. Overlay Layer (Tint for Textures)
    const renderOverlayLayer = () => {
        if (type === 'texture' && overlayColor) {
            return (
                <Rect
                    x={0} y={0} width={width} height={height}
                    fill={overlayColor}
                    opacity={0.3} // Fixed low opacity for tinting, or could be configurable
                    globalCompositeOperation="source-over" // or 'multiply' for better tinting?
                    listening={false}
                />
            );
        }
        return null;
    };

    return (
        <Group
            opacity={opacity}
            name="background-layer-group"
            listening={false} // The group itself shouldn't capture events
        >
            {renderBaseLayer()}
            {renderEffectLayer()}
            {renderOverlayLayer()}

            {/* Invisible Hit Rect to ensure clicks on background are detected if needed, 
                but we generally want them to fall through to Stage or be handled by Stage */}
            <Rect
                x={0} y={0} width={width} height={height}
                fill="transparent"
                name="background-layer-rect" // Keep this name for click detection in CanvasStage
            />
        </Group>
    );
});

BackgroundRenderer.displayName = 'BackgroundRenderer';

// --- Main Canvas Stage Component ---

type KonvaRef = React.RefObject<KonvaStageType>;

interface CanvasStageProps {
    template: CardTemplate;
    selectedNodeIndex: number | null;
    onSelectNode: (index: number | null) => void;
    onDeselectNode: () => void;
    onNodeChange: (index: number, updates: Partial<KonvaNodeProps>) => void;
    onStartEditing: (node: Konva.Text) => void; // Placeholder for text editing
    onEditQRCode?: () => void; // NEW: Handler for QR Code editing

    // CRITICAL: New prop for scaling logic (Plan 3)
    parentRef: React.RefObject<HTMLElement>;

    mode: "FULL_EDIT" | "DATA_ONLY";
}

const CanvasStage = forwardRef<KonvaStageType, CanvasStageProps>(
    ({
        template, selectedNodeIndex, onSelectNode, onDeselectNode,
        onNodeChange, onStartEditing, onEditQRCode, parentRef, mode
    }, ref) => {

        const { width: templateWidth, height: templateHeight, layers } = template;

        // CRITICAL: New state for dynamic stage size and scale
        const [stageSize, setStageSize] = useState({
            width: templateWidth,
            height: templateHeight,
            scale: 1
        });

        // --- Dynamic Scaling Logic (Plan 3) ---
        useEffect(() => {
            const container = parentRef.current;
            if (!container) return;

            let rafId: number | null = null;
            let timeoutId: number | null = null;

            const updateScale = () => {
                // Cancel any pending animation frame
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                }

                // Use requestAnimationFrame for smooth updates
                rafId = requestAnimationFrame(() => {
                    // Get the current dimensions of the <main> container
                    const parentWidth = container.offsetWidth;
                    const parentHeight = container.offsetHeight;

                    // Calculate maximum possible scale factor
                    // Formula: scale = min( (parentWidth - padding) / templateWidth, (parentHeight - padding) / templateHeight )
                    const scaleX = (parentWidth - STAGE_PADDING) / templateWidth;
                    const scaleY = (parentHeight - STAGE_PADDING) / templateHeight;

                    const newScale = Math.min(scaleX, scaleY);
                    // Ensure a minimum scale for visibility
                    const finalScale = Math.max(0.1, newScale);

                    setStageSize({
                        // The Konva stage size is the template size scaled up/down by the factor
                        width: templateWidth,
                        height: templateHeight,
                        scale: finalScale,
                    });
                });
            };

            const debouncedUpdate = () => {
                updateScale();
                // Also trigger after sidebar transition completes (500ms + 50ms buffer)
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                timeoutId = window.setTimeout(updateScale, 550);
            };

            // Initial run
            updateScale();

            // Setup ResizeObserver to run when parent container size changes (window resize, sidebar toggle)
            const observer = new ResizeObserver(debouncedUpdate);
            observer.observe(container);

            // Cleanup
            return () => {
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                }
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                observer.unobserve(container);
            };
        }, [templateWidth, templateHeight, parentRef]);



        // Transformer Reference
        const trRef = useRef<Konva.Transformer>(null);
        const layerRef = useRef<Konva.Layer>(null);

        // Snapping lines state
        const [verticalLines, setVerticalLines] = useState<SnappingLine[]>([]);
        const [horizontalLines, setHorizontalLines] = useState<SnappingLine[]>([]);
        const [isSnapping, setIsSnapping] = useState(false);

        // --- Interaction Handlers ---

        // Update transformer when selection changes
        useEffect(() => {
            const stage = (ref as KonvaRef)?.current;
            if (!stage) return;

            const transformer = trRef.current;
            if (!transformer) return;

            // Check if there is a selected node and if it's the correct one for transformation
            const selectedNodeDef = selectedNodeIndex !== null ? layers[selectedNodeIndex] : null;

            if (selectedNodeDef && mode === 'FULL_EDIT' && !selectedNodeDef.locked) {
                // Find the node by its Konva ID (which we assume is set on the Group wrapper in Renderer)
                const node = stage.findOne(`#${selectedNodeDef.id}`);

                if (node && node.getType() !== 'Stage' && node.getType() !== 'Layer') {
                    // Attach the transformer
                    transformer.nodes([node]);
                } else {
                    // Detach if node not found or invalid
                    transformer.nodes([]);
                }
            } else {
                // Detach if no selection or in restricted mode
                transformer.nodes([]);
            }

            // Must redraw the layer to show/hide the transformer immediately
            layerRef.current?.batchDraw();

        }, [selectedNodeIndex, layers, mode, ref]);


        // Handle click outside of any node/transformer
        const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
            const domTarget = e.evt.target as HTMLElement | null;

            // FIX LAYER 1: Check if click came from property panel
            if (domTarget && domTarget.closest(".property-panel")) {
                return;
            }

            // FIX LAYER 3: Check if click is on the actual canvas
            // Konva listens on the container, but we only want to process clicks on the canvas element itself
            if (!(domTarget instanceof HTMLCanvasElement)) {
                return;
            }

            // If we clicked on an already selected element, do nothing.
            // If we clicked on the canvas background itself:
            if (e.target === e.target.getStage() || e.target.name() === 'background-layer-rect') {
                onDeselectNode();
                return;
            }

            // If we clicked on a non-draggable/non-listening shape (e.g., the background rect)
            // this should be handled by the check above, but as a fallback:
            const ancestors = e.target.getAncestors();
            // Handle both Collection (array-like) and Array returns
            const ancestorsArray = Array.isArray(ancestors) ? ancestors : (ancestors as any).toArray?.() || Array.from(ancestors as any);

            if (e.target.attrs.name === 'background-layer-rect' || ancestorsArray.some((n: any) => n.name() === 'background-layer-rect')) {
                onDeselectNode();
                return;
            }

            // If we clicked on a node, find its corresponding index in the layers array
            // We assume each rendered component is wrapped in a Konva.Group with the ID
            const clickedGroup = e.target.findAncestor('Group', true);
            const clickedId = clickedGroup?.id();

            if (clickedId) {
                const index = layers.findIndex(node => node.id === clickedId);
                if (index !== -1) {
                    onSelectNode(index);
                    return;
                }
            }

            // Deselect if selection logic failed for any reason
            onDeselectNode();

        }, [layers, onSelectNode, onDeselectNode]);


        // Handle drag movement of a node
        const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>, index: number) => {
            if (mode === 'DATA_ONLY' || layers[index].locked) return;

            const node = e.target;
            const stage = node.getStage();
            if (!stage) return;

            // 1. Snapping Logic
            // Get all potential snapping lines
            const allSnappingLines = getSnappingLines(
                layers, // Pass all layers (KonvaNodeDefinition[])
                index,  // Index of dragged node
                templateWidth,
                templateHeight
            );

            const { x: newX, y: newY, snappingLines } = getSnapAndAlignLines(
                {
                    ...layers[index].props,
                    x: node.x(),
                    y: node.y(),
                    width: node.width() * node.scaleX(),
                    height: node.height() * node.scaleY(),
                    rotation: node.rotation()
                } as KonvaNodeProps,
                allSnappingLines
            );

            // Update stage state for rendering the snapping guides
            setVerticalLines(snappingLines.filter(l => l.guideType === 'v'));
            setHorizontalLines(snappingLines.filter(l => l.guideType === 'h'));
            setIsSnapping(snappingLines.length > 0);

            // Apply snapping adjustments
            node.x(newX);
            node.y(newY);

            // Update props once drag is complete
            onNodeChange(index, {
                x: newX,
                y: newY,
                // Rotation/Scale are handled by transformer on dragend/transformend
            });

        }, [layers, onNodeChange, mode, stageSize.scale, templateWidth, templateHeight]); // Include stageSize.scale in dependency array


        // Update props after drag ends
        const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, index: number) => {
            if (mode === 'DATA_ONLY' || layers[index].locked) return;

            const node = e.target;
            onNodeChange(index, {
                x: node.x(),
                y: node.y(),
            });

            // Clear snapping lines
            setVerticalLines([]);
            setHorizontalLines([]);
            setIsSnapping(false);

        }, [layers, onNodeChange, mode]);


        // Update props after transformer ends
        const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>, index: number) => {
            if (mode === 'DATA_ONLY' || layers[index].locked) return;

            const group = e.target;
            const scaleX = group.scaleX();
            const scaleY = group.scaleY();

            // Read new dimensions/rotation from the transformed group
            const newWidth = group.width() * scaleX;
            const newHeight = group.height() * scaleY;
            const newRotation = group.rotation();

            // Apply scale of 1 back to the group and update the Konva props
            group.scaleX(1);
            group.scaleY(1);

            onNodeChange(index, {
                x: group.x(),
                y: group.y(),
                width: newWidth,
                height: newHeight,
                rotation: newRotation,
            });

        }, [onNodeChange, mode, layers]);


        // Handle double-click for text editing
        const handleDblClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, index: number) => {
            const selectedNodeDef = layers[index];
            if (selectedNodeDef && selectedNodeDef.type === 'Text' && mode === 'FULL_EDIT' && !selectedNodeDef.locked) {
                // Trigger the parent component to open the text editor UI
                // FIX: Pass the actual Konva node (Text) to the handler
                onStartEditing(e.target as Konva.Text);
            } else if (selectedNodeDef && selectedNodeDef.type === 'Image' && (selectedNodeDef.props as any).qrMetadata && onEditQRCode) {
                // NEW: Handle QR Code double click
                onEditQRCode();
            }
        }, [layers, mode, onStartEditing, onEditQRCode]);


        // --- Render ---

        // Konva requires that width/height are the unscaled dimensions of the content
        // The scaleX/scaleY props handle the visual zoom

        const selectedNodeDef = selectedNodeIndex !== null ? layers[selectedNodeIndex] : null;

        return (
            // Wrapper div is not strictly necessary but can help for styling/debug
            <div
                style={{
                    // Set the size of the container to the scaled size of the card
                    width: templateWidth * stageSize.scale,
                    height: templateHeight * stageSize.scale,
                    // Optional: add a subtle shadow for a card-like effect
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                }}
                className="bg-white rounded-lg overflow-hidden transition-all duration-500 ease-in-out"
            >
                <Stage
                    ref={ref}
                    // Set Konva stage dimensions to the TEMPLATE dimensions
                    width={templateWidth}
                    height={templateHeight}
                    // CRITICAL: Apply the calculated scale factor
                    scaleX={stageSize.scale}
                    scaleY={stageSize.scale}
                    // Events
                    onClick={handleStageClick}
                    onTap={handleStageClick} // Handle mobile touch events
                >
                    {/* 1. BACKGROUND LAYER (Fixed Size, Unscaled Content) */}
                    <Layer name="background-layer">
                        <BackgroundRenderer
                            template={template}
                            background={template.background}
                        />

                        {/* Render bleed/safe margins if necessary (optional) */}
                        <Rect
                            x={BLEED_MARGIN} y={BLEED_MARGIN}
                            width={templateWidth - BLEED_MARGIN * 2}
                            height={templateHeight - BLEED_MARGIN * 2}
                            stroke="rgba(0, 0, 0, 0.1)"
                            strokeWidth={1}
                            dash={[5, 5]}
                            listening={false}
                        />

                    </Layer>

                    {/* 2. CONTENT LAYER (All layers/nodes) */}
                    <Layer ref={layerRef} name="content-layer">
                        {layers.map((nodeDef, index) => (
                            <KonvaNodeRenderer
                                key={nodeDef.id}
                                index={index}
                                node={nodeDef}
                                isSelected={selectedNodeIndex === index}
                                isLocked={nodeDef.locked}
                                isLayoutDisabled={mode === 'DATA_ONLY'} // Fix: map mode to isLayoutDisabled

                                // Event handlers
                                onSelect={() => onSelectNode(index)}
                                onNodeChange={(idx, updates) => onNodeChange(idx, updates)} // Fix: onNodeChange signature match
                                onStartEditing={onStartEditing}

                                onDragStart={() => { }} // Optional?
                                onDragMove={(e) => handleDragMove(e, index)}
                                onDragEnd={(e) => handleDragEnd(e, index)}
                            // onTransformEnd is handled via KonvaNodeRenderer props? 
                            // KonvaNodeRenderer has its own onTransformEnd handling that calls onNodeChange.
                            // So we don't need to pass handleTransformEnd explicitly to it if it handles it internally.
                            // But we need to pass onNodeChange which we did.
                            />
                        ))}

                        {/* Transformer - Only visible if an unlocked node is selected in full edit mode */}
                        {selectedNodeIndex !== null && layers[selectedNodeIndex] && (
                            <Transformer
                                ref={trRef}
                                rotationSnaps={[0, 90, 180, 270]}
                                anchorSize={10}
                                borderStrokeWidth={1}
                                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                                padding={5}
                                // Only enable transform if FULL_EDIT and NOT locked
                                visible={!!(mode === 'FULL_EDIT' && selectedNodeDef && !selectedNodeDef.locked && selectedNodeDef.type !== 'Line' && selectedNodeDef.type !== 'Arrow')}
                                // Custom check based on component state
                                ignoreStroke={false}
                                flipEnabled={false}
                                // CRITICAL: Enable keepRatio for Icon nodes and QR Codes to maintain aspect ratio
                                keepRatio={selectedNodeDef?.type === 'Icon' || (selectedNodeDef?.type === 'Image' && !!(selectedNodeDef.props as any).qrMetadata)}

                                // ADDED bounding box check for minimum size and template bounds
                                boundBoxFunc={(oldBox, newBox) => {
                                    // Prevent scaling down too small
                                    if (newBox.width * stageSize.scale < 10 || newBox.height * stageSize.scale < 10) { // check scaled minimum size
                                        return oldBox;
                                    }

                                    const templateMaxX = template.width;
                                    const templateMaxY = template.height;

                                    // Clamping logic (relative to the Group)
                                    let x = Math.max(0, newBox.x);
                                    let y = Math.max(0, newBox.y);

                                    // Clamp max X/Y position
                                    if (x + newBox.width > templateMaxX) {
                                        x = templateMaxX - newBox.width;
                                    }
                                    if (y + newBox.height > templateMaxY) {
                                        y = templateMaxY - newBox.height;
                                    }

                                    return { x, y, width: newBox.width, height: newBox.height, rotation: newBox.rotation };
                                }}
                            />
                        )}

                    </Layer>

                    {/* 3. ALIGNMENT/SNAPPING LINES LAYER */}
                    <Layer name="snapping-layer" listening={false} visible={isSnapping}>
                        {verticalLines.map((line, i) => (
                            <Rect
                                key={`v-${i}`}
                                x={line.lineCoord - 0.5} // Line should be 1px wide, center on the value
                                y={0}
                                width={1}
                                height={templateHeight}
                                fill={line.strokeColor || "#4F46E5"} // Indigo-600
                                opacity={0.7}
                            />
                        ))}
                        {horizontalLines.map((line, i) => (
                            <Rect
                                key={`h-${i}`}
                                x={0}
                                y={line.lineCoord - 0.5} // Line should be 1px wide, center on the value
                                width={templateWidth}
                                height={1}
                                fill={line.strokeColor || "#4F46E5"} // Indigo-600
                                opacity={0.7}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>
        );
    });

CanvasStage.displayName = "CanvasStage";
export default CanvasStage;





