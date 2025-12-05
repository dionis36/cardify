'use client';

import React, { useCallback } from 'react';
import { Square, Circle } from 'lucide-react';

// Import definitions from our new libraries
import { KonvaNodeDefinition, KonvaNodeType } from '@/types/template';

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
  defineShape('Circle', Circle, 'Circle', 'Basic', {
    width: 100, // Used for bounding box/placeholder if needed, but radius drives it
    height: 100,
    radius: 50,
    fill: '#9CA3AF',
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

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
        <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider">Basic Shapes</h3>
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
    </div>
  );
}