// components/editor/CanvasStage.tsx (MODIFIED - Inline Text Editing and Smart Snapping with Konva Type Fix)

"use client";

import React, { forwardRef, useRef, useEffect, useCallback, memo, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps } from "@/types/template"; 

/**
 * Define print-production constants in pixels.
 */
const BLEED_MARGIN = 15; 
const SAFE_MARGIN = 15; 

/** -------------------- Image Caching Hook -------------------- **/

const imageCache: Record<string, HTMLImageElement> = {};

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

    const img = new Image();
    img.crossOrigin = 'Anonymous'; 
    img.src = src;

    const handleLoad = () => {
      imageCache[src] = img;
      setImage(img);
    };

    img.onload = handleLoad;

    return () => {
      img.onload = null;
    };
  }, [src]);

  return image;
}

/** -------------------- Smart Snapping Types & Logic (PHASE 2.2) -------------------- **/

interface GuideLine {
    orientation: 'vertical' | 'horizontal';
    lineGuide: number;
    start: number;
    end: number;
}

const GUIDELINE_STRENGTH = 4;
const COLORS = { GUIDE: '#ff0000' }

function getAlignmentGuides(shape: Konva.Node, template: CardTemplate): GuideLine[] {
    const guides: GuideLine[] = [];
    const shapeBounds = shape.getClientRect();

    const verticalContainerGuides = [0, template.width / 2, template.width];
    const horizontalContainerGuides = [0, template.height / 2, template.height];
    
    // 1. Container Guides
    verticalContainerGuides.forEach(lineGuide => {
        [shapeBounds.x, shapeBounds.x + shapeBounds.width / 2, shapeBounds.x + shapeBounds.width].forEach(x => {
            if (Math.abs(x - lineGuide) < GUIDELINE_STRENGTH) {
                guides.push({ 
                    orientation: 'vertical', 
                    lineGuide: lineGuide, 
                    start: Math.min(shapeBounds.y, 0),
                    end: Math.max(shapeBounds.y + shapeBounds.height, template.height)
                });
            }
        });
    });

    horizontalContainerGuides.forEach(lineGuide => {
        [shapeBounds.y, shapeBounds.y + shapeBounds.height / 2, shapeBounds.y + shapeBounds.height].forEach(y => {
            if (Math.abs(y - lineGuide) < GUIDELINE_STRENGTH) {
                guides.push({ 
                    orientation: 'horizontal', 
                    lineGuide: lineGuide, 
                    start: Math.min(shapeBounds.x, 0),
                    end: Math.max(shapeBounds.x + shapeBounds.width, template.width)
                });
            }
        });
    });

    // 2. Inter-Shape Guides
    template.layers.forEach(otherNodeDef => {
        const otherNode = shape.getStage()?.findOne(`.${otherNodeDef.id}`);
        if (!otherNode || otherNode === shape) return;

        const otherBounds = otherNode.getClientRect();

        // Vertical Guides 
        [otherBounds.x, otherBounds.x + otherBounds.width / 2, otherBounds.x + otherBounds.width].forEach(otherX => {
            [shapeBounds.x, shapeBounds.x + shapeBounds.width / 2, shapeBounds.x + shapeBounds.width].forEach(shapeX => {
                if (Math.abs(shapeX - otherX) < GUIDELINE_STRENGTH) {
                    guides.push({ 
                        orientation: 'vertical', 
                        lineGuide: otherX, 
                        start: Math.min(shapeBounds.y, otherBounds.y),
                        end: Math.max(shapeBounds.y + shapeBounds.height, otherBounds.y + otherBounds.height)
                    });
                }
            });
        });

        // Horizontal Guides 
        [otherBounds.y, otherBounds.y + otherBounds.height / 2, otherBounds.y + otherBounds.height].forEach(otherY => {
            [shapeBounds.y, shapeBounds.y + shapeBounds.height / 2, shapeBounds.y + shapeBounds.height].forEach(shapeY => {
                if (Math.abs(shapeY - otherY) < GUIDELINE_STRENGTH) {
                    guides.push({ 
                        orientation: 'horizontal', 
                        lineGuide: otherY, 
                        start: Math.min(shapeBounds.x, otherBounds.x),
                        end: Math.max(shapeBounds.x + shapeBounds.width, otherBounds.x + otherBounds.width)
                    });
                }
            });
        });
    });

    // Filter duplicates
    const uniqueKeys = new Set<string>();
    return guides.filter(g => {
        const key = `${g.orientation}-${g.lineGuide}`;
        if (uniqueKeys.has(key)) return false;
        uniqueKeys.add(key);
        return true;
    });
}


/** -------------------- Node Component Types (FIXED: Using KonvaEventObject<any>) -------------------- **/

interface NodeProps {
  node: KonvaNodeDefinition;
  index: number;
  selected: boolean;
  onSelect: (node: KonvaNodeDefinition, index: number) => void;
  onChange: (index: number, newProps: Partial<KonvaNodeProps>) => void;
  // FIX: Using 'any' for the underlying DOM event to avoid TypeScript error
  onDragMove: (e: Konva.KonvaEventObject<any>, index: number) => void; 
  onDoubleClick: (e: Konva.KonvaEventObject<any>, index: number) => void; 
  mode: 'FULL_EDIT' | 'DATA_ONLY';
}

/** -------------------- Node Components (Rect, Text, Image) -------------------- **/

const TextNode: React.FC<NodeProps> = memo(({ node, index, selected, onSelect, onChange, onDragMove, onDoubleClick, mode }) => {
  const nodeRef = useRef<Konva.Text>(null);
  const isDraggable = mode === 'FULL_EDIT' && node.editable && !node.locked;
  const props = node.props || {};

  return (
    <Text
      {...props}
      id={`node-${index}`}
      ref={nodeRef}
      name={node.id}
      draggable={isDraggable}
      x={props.x || 0}
      y={props.y || 0}
      text={props.text || ""}
      fontSize={props.fontSize || 16}
      width={props.width || 200}
      height={props.height || 30}
      rotation={props.rotation || 0}
      opacity={props.opacity !== undefined ? props.opacity : 1}
      
      onDragMove={(e) => isDraggable && onDragMove(e, index)}
      
      onDragEnd={(e) => {
        if (isDraggable) onChange(index, { x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        if (isDraggable) {
          const trNode = e.target;
          onChange(index, {
            x: trNode.x(),
            y: trNode.y(),
            width: trNode.width() * trNode.scaleX(),
            height: trNode.height() * trNode.scaleY(),
            rotation: trNode.rotation(),
          });
          trNode.scaleX(1); 
          trNode.scaleY(1);
        }
      }}
      onClick={() => isDraggable && onSelect(node, index)}
      onTap={() => isDraggable && onSelect(node, index)}
      
      onDblClick={(e) => onDoubleClick(e, index)} // This now correctly passes KonvaEventObject<any>
      onDblTap={(e) => onDoubleClick(e, index)} // This now correctly passes KonvaEventObject<any>
      
      listening={node.editable && !node.locked} 
      visible={props.visible === false ? false : true}
    />
  );
});

const RectNode: React.FC<NodeProps> = memo(({ node, index, selected, onSelect, onChange, onDragMove, mode }) => {
    const isDraggable = mode === 'FULL_EDIT' && node.editable && !node.locked;
    const props = node.props || {};

    return (
        <Rect
          {...props}
          id={`node-${index}`}
          name={node.id}
          draggable={isDraggable}
          x={props.x || 0}
          y={props.y || 0}
          width={props.width || 50}
          height={props.height || 50}
          rotation={props.rotation || 0}
          opacity={props.opacity !== undefined ? props.opacity : 1}
          
          onDragMove={(e) => isDraggable && onDragMove(e, index)}
          onDragEnd={(e) => {
            if (isDraggable) onChange(index, { x: e.target.x(), y: e.target.y() });
          }}
          onTransformEnd={(e) => {
            if (isDraggable) {
              const trNode = e.target;
              onChange(index, {
                x: trNode.x(),
                y: trNode.y(),
                width: trNode.width() * trNode.scaleX(),
                height: trNode.height() * trNode.scaleY(),
                rotation: trNode.rotation(),
              });
              trNode.scaleX(1); 
              trNode.scaleY(1);
            }
          }}
          onClick={() => isDraggable && onSelect(node, index)}
          onTap={() => isDraggable && onSelect(node, index)}
          listening={node.editable && !node.locked} 
        />
    );
});

const ImageNode: React.FC<NodeProps> = memo(({ node, index, selected, onSelect, onChange, onDragMove, mode }) => {
    const props = node.props || {};
    const image = useCachedImage(props.src);
    const isDraggable = mode === 'FULL_EDIT' && node.editable && !node.locked;

    return (
        <KonvaImage
            {...props}
            id={`node-${index}`}
            name={node.id}
            draggable={isDraggable}
            image={image}
            x={props.x || 0}
            y={props.y || 0}
            width={props.width || 100}
            height={props.height || 100}
            rotation={props.rotation || 0}
            opacity={props.opacity !== undefined ? props.opacity : 1}

            onDragMove={(e) => isDraggable && onDragMove(e, index)}
            onDragEnd={(e) => {
              if (isDraggable) onChange(index, { x: e.target.x(), y: e.target.y() });
            }}
            onTransformEnd={(e) => {
                if (isDraggable) {
                    const trNode = e.target;
                    onChange(index, {
                        x: trNode.x(),
                        y: trNode.y(),
                        width: trNode.width() * trNode.scaleX(),
                        height: trNode.height() * trNode.scaleY(),
                        rotation: trNode.rotation(),
                    });
                    trNode.scaleX(1);
                    trNode.scaleY(1);
                }
            }}
            onClick={() => isDraggable && onSelect(node, index)}
            onTap={() => isDraggable && onSelect(node, index)}
            listening={node.editable && !node.locked}
        />
    );
});


/** -------------------- Main Canvas Stage Component -------------------- **/

interface TextEditorProps {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    align: 'left' | 'center' | 'right';
    lineHeight: number;
    letterSpacing: number;
    nodeIndex: number;
}

interface CanvasStageProps {
  template: CardTemplate;
  selectedIndex: number | null;
  onSelectNode: (node: KonvaNodeDefinition | null, index: number | null) => void;
  onNodeChange: (index: number, newProps: Partial<KonvaNodeProps>) => void;
  mode?: 'FULL_EDIT' | 'DATA_ONLY';
}

const CanvasStage = forwardRef<Konva.Stage | null, CanvasStageProps>(
  ({ template, selectedIndex, onSelectNode, onNodeChange, mode = 'FULL_EDIT' }, ref) => {
    
    const stageContainerRef = useRef<HTMLDivElement>(null);
    const layerRef = useRef<Konva.Layer>(null);
    const guideLayerRef = useRef<Konva.Layer>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    
    // Inline Text Editing State (Phase 2.1)
    const [textEditorProps, setTextEditorProps] = useState<TextEditorProps | null>(null);
    const [textEditorValue, setTextEditorValue] = useState('');
    
    // Smart Guides State (Phase 2.2)
    const [guides, setGuides] = useState<GuideLine[]>([]);


    // -------------------- HANDLERS: Snapping (Phase 2.2) --------------------
    
    // FIX: Changed type to KonvaEventObject<any>
    const handleNodeDragMove = useCallback((e: Konva.KonvaEventObject<any>, index: number) => { 
        const node = e.target;
        
        if (textEditorProps) {
            setGuides([]);
            return;
        }

        const alignmentGuides = getAlignmentGuides(node, template);
        
        let x = node.x();
        let y = node.y();

        alignmentGuides.forEach(g => {
            if (g.orientation === 'vertical') {
                x = g.lineGuide;
            } else {
                y = g.lineGuide;
            }
        });
        
        node.position({ x, y });
        setGuides(alignmentGuides);
        
    }, [template, textEditorProps]);

    const handleNodeTransformEnd = useCallback((e: Konva.KonvaEventObject<any>, index: number) => {
        const trNode = e.target;
        
        setGuides([]);
        
        onNodeChange(index, {
            x: trNode.x(),
            y: trNode.y(),
            width: trNode.width() * trNode.scaleX(),
            height: trNode.height() * trNode.scaleY(),
            rotation: trNode.rotation(),
        });
        
        trNode.scaleX(1); 
        trNode.scaleY(1);
    }, [onNodeChange]);


    // -------------------- HANDLERS: Text Editing (Phase 2.1) --------------------

    // FIX: Changed type to KonvaEventObject<any>
    const handleTextDoubleClick = useCallback((e: Konva.KonvaEventObject<any>, index: number) => {
        if (mode !== 'FULL_EDIT') return;

        // Cast to Konva.Text here if needed, but the original logic uses e.target as Konva.Node
        // We know from context this will be a Text node when called from TextNode
        const node = e.target as Konva.Text; 
        if (node.getClassName() !== 'Text') return;
        
        onSelectNode(template.layers[index], index);
        transformerRef.current?.nodes([]);

        const nodeDefinition = template.layers[index];
        const props = nodeDefinition.props;
        
        const textValue = props.text || '';
        
        // Use getClientRect for position/size independent of rotation/scale
        const nodeRect = node.getClientRect(); 

        const editorStyle: TextEditorProps = {
            // Position relative to the Stage container's top-left (Group offset + Konva position)
            x: nodeRect.x + BLEED_MARGIN, 
            y: nodeRect.y + BLEED_MARGIN,
            width: nodeRect.width,
            height: nodeRect.height,
            rotation: props.rotation || 0,
            
            text: textValue,
            fontSize: props.fontSize || 16,
            fontFamily: props.fontFamily || "Arial",
            align: props.align || 'left',
            lineHeight: props.lineHeight || 1.2,
            letterSpacing: props.letterSpacing || 0,
            nodeIndex: index,
        };

        setTextEditorProps(editorStyle);
        setTextEditorValue(textValue);
        
        node.getLayer()?.batchDraw();

    }, [template.layers, onSelectNode, mode]);


    const handleTextEditorBlur = useCallback(() => {
        if (!textEditorProps) return;

        onNodeChange(textEditorProps.nodeIndex, { text: textEditorValue });
        
        setTextEditorProps(null);
        setTextEditorValue('');
        
        const layer = layerRef.current;
        if (layer) {
            const selectedNodeKonva = layer.findOne(`#node-${textEditorProps.nodeIndex}`);
            // Re-attach transformer if the node is still selected
            if (selectedNodeKonva && selectedIndex === textEditorProps.nodeIndex && mode === 'FULL_EDIT') {
                 transformerRef.current?.nodes([selectedNodeKonva]);
            }
            layer.batchDraw();
        }

    }, [textEditorProps, textEditorValue, onNodeChange, selectedIndex, mode]);


    // -------------------- Effects and Draw Logic --------------------

    useEffect(() => {
      const layer = layerRef.current;
      const transformer = transformerRef.current;
      
      if (!layer || !transformer) return;
      
      if (selectedIndex != null && !textEditorProps) { 
        const selectedNodeKonva = layer.findOne(`#node-${selectedIndex}`);
        
        const layerDefinition = template.layers[selectedIndex];
        const isTransformable = layerDefinition?.editable && !layerDefinition?.locked && mode === 'FULL_EDIT';
        
        if (selectedNodeKonva && isTransformable) {
          transformer.nodes([selectedNodeKonva]);
        } else {
          transformer.nodes([]);
        }
      } else {
        transformer.nodes([]);
      }

      layer.batchDraw();
    }, [selectedIndex, template.layers, mode, textEditorProps]);

    const drawGuides = useCallback(() => {
        if (!guideLayerRef.current) return;
        
        guideLayerRef.current.destroyChildren();
        
        guides.forEach(g => {
            const guideLine = new Konva.Line({
                stroke: COLORS.GUIDE,
                strokeWidth: 2,
                dash: [4, 4],
                points: g.orientation === 'vertical'
                    ? [g.lineGuide + BLEED_MARGIN, g.start + BLEED_MARGIN, g.lineGuide + BLEED_MARGIN, g.end + BLEED_MARGIN]
                    : [g.start + BLEED_MARGIN, g.lineGuide + BLEED_MARGIN, g.end + BLEED_MARGIN, g.lineGuide + BLEED_MARGIN]
            });
            guideLayerRef.current?.add(guideLine);
        });
        
        guideLayerRef.current.batchDraw();
        
    }, [guides]);
    
    useEffect(() => {
        drawGuides();
    }, [drawGuides]);

    // -------------------- RENDER LOGIC --------------------

    const renderNode = useCallback(
      (node: KonvaNodeDefinition, index: number) => {
        
        const isEditing = textEditorProps?.nodeIndex === index;
        const isVisible = node.props.visible === false ? false : true;
        const visibleProp = isEditing ? false : isVisible;

        const props: NodeProps = { 
          node: {...node, props: {...node.props, visible: visibleProp}},
          index, 
          selected: index === selectedIndex, 
          onSelect: onSelectNode, 
          onChange: onNodeChange,
          onDragMove: handleNodeDragMove,
          onDoubleClick: handleTextDoubleClick,
          mode: mode,
        };
        switch (node.type) {
          case "Text":
            return <TextNode key={node.id} {...props} />;
          case "Rect":
            return <RectNode key={node.id} {...props} onDoubleClick={() => handleTextDoubleClick({} as Konva.KonvaEventObject<any>, index)} />;
          case "Image":
            return <ImageNode key={node.id} {...props} onDoubleClick={() => handleTextDoubleClick({} as Konva.KonvaEventObject<any>, index)} />;
          default:
            console.warn(`Unsupported Konva node type: ${node.type}`);
            return null;
        }
      },
      [selectedIndex, onSelectNode, onNodeChange, handleNodeDragMove, handleTextDoubleClick, mode, textEditorProps]
    );
    
    const handleStageDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (textEditorProps) {
            handleTextEditorBlur();
            return;
        }
        
        if (e.target === e.target.getStage() || e.target.name() === "trim-box") {
            onSelectNode(null, null);
        }
    };
    

    const stageWidth = template.width + 2 * BLEED_MARGIN;
    const stageHeight = template.height + 2 * BLEED_MARGIN;
    
    const safeZoneX = BLEED_MARGIN + SAFE_MARGIN;
    const safeZoneY = BLEED_MARGIN + SAFE_MARGIN;
    const safeZoneWidth = template.width - 2 * SAFE_MARGIN;
    const safeZoneHeight = template.height - 2 * SAFE_MARGIN;

    return (
      <div ref={stageContainerRef} className="relative mx-auto" style={{ width: stageWidth, height: stageHeight }}>
        
        {/* HTML Text Editor Overlay (Phase 2.1) */}
        {textEditorProps && (
            <textarea
                value={textEditorValue}
                onChange={(e) => setTextEditorValue(e.target.value)}
                onBlur={handleTextEditorBlur}
                autoFocus
                style={{
                    position: 'absolute',
                    top: textEditorProps.y,
                    left: textEditorProps.x,
                    width: textEditorProps.width,
                    height: textEditorProps.height,
                    fontSize: `${textEditorProps.fontSize}px`,
                    fontFamily: textEditorProps.fontFamily,
                    textAlign: textEditorProps.align,
                    lineHeight: textEditorProps.lineHeight.toString(),
                    letterSpacing: `${textEditorProps.letterSpacing}px`,
                    padding: 0,
                    margin: 0,
                    border: '1px solid #1D4ED8',
                    background: 'transparent',
                    color: template.layers[textEditorProps.nodeIndex]?.props.fill || '#000000',
                    resize: 'none',
                    outline: 'none',
                    transform: `rotate(${textEditorProps.rotation}deg)`,
                    transformOrigin: 'top left',
                    zIndex: 100,
                    overflow: 'hidden',
                }}
                className="p-1"
            />
        )}
        
        <Stage
          width={stageWidth}
          height={stageHeight}
          ref={ref}
          onMouseDown={handleStageDeselect} 
          onTouchStart={handleStageDeselect} 
        >
          <Layer>
            
            {/* 1. BLEED BACKGROUND */}
            <Rect x={0} y={0} width={stageWidth} height={stageHeight} fill="#F0F0F0" listening={false} />

            {/* 2. TRIM LINE / CARD BACKGROUND */}
            <Rect
              x={BLEED_MARGIN}
              y={BLEED_MARGIN}
              width={template.width}
              height={template.height}
              fill="#FFFFFF"
              stroke="#1D4ED8"
              strokeWidth={1}
              cornerRadius={4}
              name="trim-box"
              listening={true}
            />
            
            {/* 3. SAFE ZONE GUIDE */}
            <Rect
              x={safeZoneX}
              y={safeZoneY}
              width={safeZoneWidth}
              height={safeZoneHeight}
              stroke="#EF4444"
              strokeWidth={1}
              dash={[5, 5]}
              fill="transparent"
              listening={false}
              name="safe-zone-guide"
            />
          </Layer>
          
          {/* Layer 2: Alignment Guides (Phase 2.2) */}
          <Layer ref={guideLayerRef} /> 
          
          {/* Layer 3: Main Layers and Transformer */}
          <Layer ref={layerRef}>
            <Group x={BLEED_MARGIN} y={BLEED_MARGIN} name="template-layers">
              {template.layers.slice().reverse().map((node, index, arr) => {
                  const originalIndex = arr.length - 1 - index;
                  return renderNode(node, originalIndex);
              })}
            </Group>
            
            {/* 5. TRANSFORMER */}
            <Transformer
              ref={transformerRef}
              enabledAnchors={[
                  'top-left', 'top-right', 'bottom-left', 'bottom-right', 
                  'middle-left', 'middle-right', 'top-center', 'bottom-center'
              ]}
              rotationSnaps={[0, 90, 180, 270]}
              boundBoxFunc={(oldBox, newBox) => {
                  const templateMaxX = template.width;
                  const templateMaxY = template.height;
                  
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
          </Layer>
        </Stage>
      </div>
    );
  }
);

CanvasStage.displayName = "CanvasStage";

export default CanvasStage;



