// components/editor/ShapeLibrary.tsx (Updated for Professional UX)

'use client';

import React, { useCallback } from 'react';
import { 
  Square, Circle, Minus, Star, 
  HardHat, Pentagon, 
  Feather, ArrowRight, Text, UploadCloud, CornerUpRight
} from 'lucide-react'; // Using Lucide for icon integration

// Assuming type definitions are imported
import { KonvaNodeDefinition, KonvaNodeType } from '@/types/template';

// --- Types and Constants ---
interface ShapeButton {
  type: KonvaNodeType;
  icon: React.FC<any>;
  name: string;
  group: 'Text' | 'Basic' | 'Vector'; // NEW: Separate 'Text' group
  defaultProps: Partial<KonvaNodeDefinition['props']>;
}

const START_POS = 50; 

// Helper function to define shapes clearly
const defineShape = (type: KonvaNodeType, icon: React.FC<any>, name: string, group: ShapeButton['group'], defaultProps: any): ShapeButton => ({
    type, icon, name, group, defaultProps
});


const SHAPE_DEFINITIONS: ShapeButton[] = [
  // 1. TEXT INPUT (Dedicated Group)
  defineShape('Text', Text, 'Text Box', 'Text', { 
      width: 250, 
      height: 40, 
      text: "Click to edit text", 
      fontSize: 28, 
      fill: '#000000', 
      fontFamily: 'Inter',
      rotation: 0, 
      opacity: 1 
  }),

  // 2. BASIC GEOMETRIC SHAPES
  defineShape('Rect', Square, 'Rectangle', 'Basic', { 
    width: 100, 
    height: 100, 
    fill: '#333333', 
    cornerRadius: 4,
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Circle', Circle, 'Circle', 'Basic', { 
    width: 80, 
    height: 80, 
    radius: 40, 
    fill: '#9CA3AF',
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Ellipse', HardHat, 'Ellipse', 'Basic', { 
    width: 120, 
    height: 60, 
    radiusX: 60, 
    radiusY: 30, 
    fill: '#9CA3AF',
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Star', Star, 'Star', 'Basic', { 
    width: 80, 
    height: 80, 
    numPoints: 5, 
    innerRadius: 20, 
    outerRadius: 40, 
    fill: '#FFC107',
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('RegularPolygon', Pentagon, 'Hexagon', 'Basic', { 
    width: 70, 
    height: 70, 
    sides: 6, 
    radius: 35, 
    fill: '#374151',
    rotation: 0, 
    opacity: 1 
  }),

  // 3. VECTOR AND LINE TOOLS
  defineShape('Line', Minus, 'Line', 'Vector', { 
    width: 100, 
    height: 1, 
    stroke: '#1F2937', 
    strokeWidth: 4, 
    points: [0, 0, 100, 0],
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Arrow', ArrowRight, 'Arrow', 'Vector', { 
    width: 120, 
    height: 1, 
    stroke: '#073A99', 
    strokeWidth: 6, 
    points: [0, 0, 120, 0],
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Path', Feather, 'Path (Vector)', 'Vector', { 
    width: 80, 
    height: 80, 
    fill: '#F59E0B', 
    data: 'M 50 0 L 100 86 L 0 86 Z',
    rotation: 0, 
    opacity: 1 
  }),
];

// --- Component Props ---

interface ShapeLibraryProps {
    onAddNode: (node: KonvaNodeDefinition) => void;
}

/**
 * The ShapeLibrary component for the editor sidebar.
 * Allows users to quickly add various elements with a professional, grouped UI.
 */
export function ShapeLibrary({ onAddNode }: ShapeLibraryProps) {

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
        id, // Konva Node props must contain id
        x: START_POS,
        y: START_POS,
        // Spread the specific shape properties
        ...shape.defaultProps,
      } as KonvaNodeDefinition['props'], // Type assertion for complex union
      editable: true,
      locked: false, // Default new shapes to unlocked
    } as KonvaNodeDefinition;

    onAddNode(newNode);
  }, [onAddNode]);

  /**
   * Renders a group of shape buttons based on the defined category.
   */
  const renderShapeGroup = (groupName: string, shapes: ShapeButton[], columns: number = 4) => {
    // If only one button (like the Text Box), make it span all columns
    const gridClass = shapes.length === 1 && groupName === 'Text' 
        ? 'grid-cols-1' 
        : `grid-cols-${columns}`;

    return (
        <div key={groupName} className="space-y-3">
            <h4 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">{groupName}</h4>
            <div className={`grid ${gridClass} gap-2`}>
                {shapes.map(shape => (
                    <button
                        key={shape.type}
                        onClick={() => handleAddShape(shape)}
                        title={`Add ${shape.name}`}
                        // Refined styling for a cleaner, modern look
                        className="flex flex-col items-center justify-center p-2 border border-gray-600 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-sm h-16 w-full shadow-md"
                    >
                        <shape.icon size={20} className="text-gray-200" />
                        <span className="text-xs text-center text-gray-300 mt-1">{shape.name.split('(')[0].trim()}</span>
                    </button>
                ))}
            </div>
        </div>
    );
  }

  const textNode = SHAPE_DEFINITIONS.filter(s => s.group === 'Text');
  const basicShapes = SHAPE_DEFINITIONS.filter(s => s.group === 'Basic');
  const vectorShapes = SHAPE_DEFINITIONS.filter(s => s.group === 'Vector');


  return (
    <div className="p-4 space-y-6">
      
      {/* 1. DEDICATED TEXT SECTION (1-column layout) */}
      {renderShapeGroup('Text', textNode, 1)}
      
      <div className="border-t border-gray-700 pt-3"></div>

      {/* 2. BASIC SHAPES (4-column layout) */}
      {renderShapeGroup('Basic Shapes', basicShapes, 4)}

      {/* 3. VECTOR AND LINE TOOLS (4-column layout) */}
      {renderShapeGroup('Vector & Line Tools', vectorShapes, 4)}

      {/* 4. WIP Tools Section */}
      <div className="border-t border-gray-700 pt-4 space-y-3">
        <h3 className="font-semibold text-sm text-default text-gray-400 uppercase tracking-wider">WIP Tools</h3>
        <button disabled className="flex items-center w-full p-2 rounded text-left bg-gray-700/50 text-gray-500 text-sm opacity-60">
          <UploadCloud size={18} className="mr-2" />
          Image/Logo Upload (Assets Tab)
        </button>
        <button disabled className="flex items-center w-full p-2 rounded text-left bg-gray-700/50 text-gray-500 text-sm opacity-60">
          <CornerUpRight size={18} className="mr-2" />
          QR/Barcode Generator
        </button>
      </div>
    </div>
  );
}