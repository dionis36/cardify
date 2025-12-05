'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { Square, Circle, ChevronDown, ChevronRight, Star, Flower2, Shapes, Grid3x3, Sparkles } from 'lucide-react';

// Import definitions from our new libraries
import { KonvaNodeDefinition, KonvaNodeType } from '@/types/template';

// Import the shapes library
import shapesLibrary from '@/public/shapes/shapes-library.json';

// --- Types and Constants ---
interface ShapeButton {
  type: KonvaNodeType;
  icon: React.FC<any>;
  name: string;
  group: 'Text' | 'Basic' | 'Vector';
  defaultProps: Partial<KonvaNodeDefinition['props']>;
}

interface CustomShape {
  id: string;
  name: string;
  category: string;
  pathData: string;
  viewBox: string;
  transform: string;
  scaleValue: number;
  originalFill: string;
  displayFill: string;
  originalStroke: string;
  displayStroke: string;
  strokeWidth: number;
  opacity: number;
  defaultWidth: number;
  defaultHeight: number;
}

const START_POS = 50;

// Helper function to define shapes clearly
const defineShape = (type: KonvaNodeType, icon: React.FC<any>, name: string, group: ShapeButton['group'], defaultProps: any): ShapeButton => ({
  type, icon, name, group, defaultProps
});

const SHAPE_DEFINITIONS: ShapeButton[] = [
  // 2. BASIC GEOMETRIC SHAPES
  defineShape('Rect', Square, 'Rectangle', 'Basic', {
    width: 100,
    height: 100,
    fill: '#333333',
    cornerRadius: 0,
    rotation: 0,
    opacity: 1
  }),
  defineShape('Circle', Circle, 'Circle', 'Basic', {
    width: 100, // Used for bounding box/placeholder if needed, but radius drives it
    height: 100,
    radius: 50,
    fill: '#9CA3AF',
    rotation: 0,
    opacity: 1
  }),
];

// Category display names and icons
const CATEGORY_NAMES: Record<string, string> = {
  stars: 'Stars & Bursts',
  organic: 'Organic Shapes',
  simple: 'Simple Shapes',
  geometric: 'Geometric Patterns',
  misc: 'Decorative Elements'
};

const CATEGORY_ICONS: Record<string, React.FC<any>> = {
  stars: Star,
  organic: Flower2,
  simple: Shapes,
  geometric: Grid3x3,
  misc: Sparkles
};

// --- Component Props ---

interface ShapeLibraryProps {
  onAddNode: (node: KonvaNodeDefinition) => void;
}

/**
 * The ShapeLibrary component for the editor sidebar.
 * Allows users to quickly add various elements with a professional, grouped UI.
 */
export function ShapeLibrary({ onAddNode }: ShapeLibraryProps) {
  // State for collapsed categories (lazy loading)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  /**
   * Generates the full KonvaNodeDefinition and calls the parent's onAddNode function.
   */
  const handleAddShape = useCallback((shape: ShapeButton) => {
    // Generate a unique ID for the node
    const id = `node_${shape.type.toLowerCase()}_${Date.now()}`;

    const newNode: KonvaNodeDefinition = {
      id,
      type: shape.type,
      props: {
        id,
        x: START_POS,
        y: START_POS,
        // Spread the specific shape properties
        ...shape.defaultProps,
      } as KonvaNodeDefinition['props'],
      editable: true,
      locked: false,
    } as KonvaNodeDefinition;

    onAddNode(newNode);
  }, [onAddNode]);

  /**
   * Add a custom shape from the library
   */
  const handleAddCustomShape = useCallback((shape: CustomShape) => {
    const id = `node_path_${Date.now()}`;

    // For shapes with scale transform, calculate the actual display size
    // Instead of using scaleX/scaleY, we multiply the default size by the scale value
    // This ensures the Path renders at the correct size without transform issues
    const displayWidth = shape.defaultWidth * (shape.scaleValue || 1);
    const displayHeight = shape.defaultHeight * (shape.scaleValue || 1);

    const newNode: KonvaNodeDefinition = {
      id,
      type: 'Path',
      props: {
        id,
        x: START_POS,
        y: START_POS,
        width: displayWidth,
        height: displayHeight,
        data: shape.pathData,
        fill: shape.originalFill,
        stroke: shape.originalStroke,
        strokeWidth: shape.strokeWidth,
        opacity: shape.opacity,
        rotation: 0,
        // Don't use scaleX/scaleY - use width/height directly
        scaleX: 1,
        scaleY: 1,
      },
      editable: true,
      locked: false,
    } as KonvaNodeDefinition;

    onAddNode(newNode);
  }, [onAddNode]);

  /**
   * Toggle category expansion
   */
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  /**
   * Get shapes by category (memoized for performance)
   */
  const shapesByCategory = useMemo(() => {
    const categories = shapesLibrary.categories as Record<string, string[]>;
    const shapes = shapesLibrary.shapes as CustomShape[];

    const result: Record<string, CustomShape[]> = {};

    Object.entries(categories).forEach(([category, shapeIds]) => {
      result[category] = shapeIds
        .map(id => shapes.find(s => s.id === id))
        .filter((s): s is CustomShape => s !== undefined);
    });

    return result;
  }, []);

  /**
   * Render SVG thumbnail for custom shape
   */
  const renderShapeThumbnail = useCallback((shape: CustomShape) => {
    // For shapes with scale transform, use larger viewBox (480x480) to show full shape
    // Original shapes with scale(0.417) have path data in 480x480 coordinate system
    const hasScaleTransform = shape.transform.includes('scale');
    const viewBox = hasScaleTransform ? '0 0 480 480' : shape.viewBox;

    // Don't apply transform in thumbnail - just use correct viewBox
    const svgContent = `<path d="${shape.pathData}" fill="${shape.displayFill}" stroke="${shape.displayStroke}" stroke-width="${shape.strokeWidth}" />`;

    return (
      <svg
        width="40"
        height="40"
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }, []);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
        {/* Basic Shapes Section */}
        <div>
          <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-3">Basic Shapes</h3>
          <div className="grid grid-cols-2 gap-3">
            {SHAPE_DEFINITIONS.map((shape, idx) => (
              <button
                key={`${shape.name}-${idx}`}
                onClick={() => handleAddShape(shape)}
                title={`Add ${shape.name}`}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200 aspect-square shadow-sm hover:shadow-md group"
              >
                <shape.icon size={32} className="text-gray-600 group-hover:text-blue-600 transition-colors mb-2" strokeWidth={1.5} />
                <span className="text-xs text-center text-gray-600 font-medium group-hover:text-gray-900">{shape.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Shapes Section */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-3">
            Custom Shapes ({shapesLibrary.totalShapes})
          </h3>

          <div className="space-y-2">
            {Object.entries(shapesByCategory).map(([category, shapes]) => {
              const isExpanded = expandedCategories.has(category);
              const displayName = CATEGORY_NAMES[category] || category;

              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {React.createElement(CATEGORY_ICONS[category] || Shapes, {
                        size: 16,
                        className: "text-gray-600"
                      })}
                      <span className="text-sm font-medium text-gray-700">
                        {displayName} ({shapes.length})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                  </button>

                  {/* Category Content (Lazy Loaded) */}
                  {isExpanded && (
                    <div className="p-3 bg-white grid grid-cols-3 gap-2">
                      {shapes.map((shape) => (
                        <button
                          key={shape.id}
                          onClick={() => handleAddCustomShape(shape)}
                          title={`${shape.id}: ${shape.name}`}
                          className="flex flex-col items-center justify-center p-2 border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-400 rounded-lg transition-all duration-200 aspect-square group"
                        >
                          {renderShapeThumbnail(shape)}
                          <span className="text-[10px] text-center text-gray-500 mt-1 truncate w-full group-hover:text-gray-900">
                            {shape.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
