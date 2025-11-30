'use client';

import React, { useCallback } from 'react';
import {
  Square, Circle, Minus, Star,
  HardHat, Pentagon,
  Feather, ArrowRight, UploadCloud, CornerUpRight
} from 'lucide-react';

// Import definitions from our new libraries
import { KonvaNodeDefinition, KonvaNodeType } from '@/types/template';
import { COMPLEX_SHAPE_DEFINITIONS } from '@/lib/complex-shapes';

// --- Types and Constants ---
interface ShapeButton {
  type: KonvaNodeType;
  icon: React.FC<any>;
  name: string;
  group: 'Text' | 'Basic' | 'Vector';
  defaultProps: Partial<KonvaNodeDefinition['props']>;
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
  defineShape('Rect', Square, 'Rounded Rect', 'Basic', {
    width: 100,
    height: 100,
    fill: '#333333',
    cornerRadius: 20,
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

  // 3. STANDARD VECTOR TOOLS
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
  defineShape('Path', Feather, 'Custom Path', 'Vector', {
    width: 80,
    height: 80,
    fill: '#F59E0B',
    // A simple feather-like path placeholder
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
   * Renders a group of shape buttons based on the defined category.
   */
  const renderShapeGroup = (groupName: string, shapes: ShapeButton[], columns: number = 4) => {
    // If only one button (like the Text Box), make it span all columns
    const gridClass = shapes.length === 1 && groupName === 'Text'
      ? 'grid-cols-1'
      : `grid-cols-${columns}`;

    return (
      <div key={groupName} className="space-y-3">
        <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider px-1">{groupName}</h4>
        <div className={`grid ${gridClass} gap-3`}>
          {shapes.map((shape, idx) => (
            <button
              key={`${shape.name}-${idx}`}
              onClick={() => handleAddShape(shape)}
              title={`Add ${shape.name}`}
              className="flex flex-col items-center justify-center p-3 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all duration-200 text-sm h-20 w-full shadow-sm hover:shadow-md group"
            >
              <shape.icon size={24} className="text-gray-600 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
              <span className="text-xs text-center text-gray-600 mt-2 truncate w-full px-1 group-hover:text-gray-900 font-medium">{shape.name.split('(')[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- DATA PREPARATION ---

  // 1. Separate Standard Shapes
  const basicShapes = SHAPE_DEFINITIONS.filter(s => s.group === 'Basic');
  const standardVectors = SHAPE_DEFINITIONS.filter(s => s.group === 'Vector');

  // 2. Map Complex Shapes to Buttons
  // These come from lib/complex-shapes.ts and need to be formatted for the UI
  const complexShapeButtons: ShapeButton[] = COMPLEX_SHAPE_DEFINITIONS.map(s => ({
    type: 'Path', // Complex shapes are almost always Paths
    icon: s.icon,
    name: s.name,
    group: 'Vector',
    defaultProps: s.defaultProps,
  }));

  // 3. Merge Vectors & Complex Shapes
  const allVectorShapes = [...standardVectors, ...complexShapeButtons];


  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pb-20">

        {/* 2. BASIC SHAPES */}
        {renderShapeGroup('Basic Shapes', basicShapes, 3)}

        <div className="border-t border-gray-200 pt-3"></div>

        {/* 3. VECTOR & COMPLEX SHAPES */}
        {renderShapeGroup('Vector & Complex Shapes', allVectorShapes, 3)}

        {/* 4. WIP Tools Section */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider px-1">WIP Tools</h3>
          <button disabled className="flex items-center w-full p-3 rounded-lg text-left bg-gray-100 text-gray-400 text-sm opacity-60 cursor-not-allowed border border-gray-200">
            <UploadCloud size={18} className="mr-2" />
            Image/Logo Upload (Assets Tab)
          </button>
          <button disabled className="flex items-center w-full p-3 rounded-lg text-left bg-gray-100 text-gray-400 text-sm opacity-60 cursor-not-allowed border border-gray-200">
            <CornerUpRight size={18} className="mr-2" />
            QR/Barcode Generator
          </button>
        </div>
      </div>
    </div>
  );
}