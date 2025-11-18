// components/editor/ShapeLibrary.tsx

'use client';

import React, { useCallback, useMemo } from 'react';
import { 
  Square, Circle, Minus, Star, 
  HardHat, Pentagon, 
  Feather, ArrowRight, Text, UploadCloud 
} from 'lucide-react'; // Using Lucide for icon integration

// Assuming type definitions are imported
import { KonvaNodeDefinition, KonvaNodeType } from '@/types/template';

// --- Shape Definitions and Default Props ---

interface ShapeButton {
  type: KonvaNodeType;
  icon: React.FC<any>;
  name: string;
  defaultProps: Partial<KonvaNodeDefinition['props']>;
}

const START_POS = 50; 

// Helper function to define shapes clearly
const defineShape = (type: KonvaNodeType, icon: React.FC<any>, name: string, defaultProps: any): ShapeButton => ({
    type, icon, name, defaultProps
});


const SHAPE_DEFINITIONS: ShapeButton[] = [
  // ADDED: Text node definition
  defineShape('Text', Text, 'Text Box', { 
    width: 200, 
    height: 40, 
    text: "New Text", 
    fontSize: 24, 
    fill: '#000000', 
    fontFamily: 'Arial',
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Rect', Square, 'Rectangle', { 
    width: 100, 
    height: 100, 
    fill: '#073A99', 
    cornerRadius: 8,
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Circle', Circle, 'Circle', { 
    width: 80, 
    height: 80, 
    radius: 40, 
    fill: '#E5E7EB',
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Ellipse', HardHat, 'Ellipse', { 
    width: 120, 
    height: 60, 
    radiusX: 60, 
    radiusY: 30, 
    fill: '#9CA3AF',
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Star', Star, 'Star', { 
    width: 100, 
    height: 100, 
    numPoints: 5, 
    innerRadius: 25, 
    outerRadius: 50, 
    fill: '#FFC107',
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('RegularPolygon', Pentagon, 'Hexagon', { 
    width: 80, 
    height: 80, 
    sides: 6, 
    radius: 40, 
    fill: '#374151',
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Line', Minus, 'Line', { 
    width: 100, 
    height: 1, 
    stroke: '#1F2937', 
    strokeWidth: 4, 
    points: [0, 0, 100, 0],
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Arrow', ArrowRight, 'Arrow', { 
    width: 120, 
    height: 1, 
    stroke: '#073A99', 
    strokeWidth: 6, 
    points: [0, 0, 120, 0],
    rotation: 0, 
    opacity: 1 
  }),
  defineShape('Path', Feather, 'Path (Custom)', { 
    width: 100, 
    height: 86, 
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
 * Allows users to quickly add various geometric and custom shapes.
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

  // UI layout for the shapes
  const renderShapeButtons = useMemo(() => {
    return SHAPE_DEFINITIONS.map(shape => (
      <button
        key={shape.type}
        onClick={() => handleAddShape(shape)}
        title={`Add ${shape.name}`}
        // Updated grid layout class for 3 columns
        className="flex flex-col items-center justify-center p-2 border border-gray-700 bg-background hover:bg-gray-700 rounded transition-colors text-sm h-20 w-full"
      >
        <shape.icon size={24} className="mb-1" />
        <span className="text-xs">{shape.name.split('(')[0].trim()}</span>
      </button>
    ));
  }, [handleAddShape]);


  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm text-default">Quick Shapes (2.3)</h3>
      
      {/* Updated to grid-cols-3 */}
      <div className="grid grid-cols-3 gap-3">
        {renderShapeButtons}
      </div>

      {/* Placeholder for future tools like QR Code, Logo Upload, etc. */}
      <div className="border-t border-gray-700 pt-4 space-y-3">
        <h3 className="font-semibold text-sm text-default">WIP Tools</h3>
        <button disabled className="flex items-center w-full p-2 rounded text-left bg-gray-800/50 text-gray-500">
          <UploadCloud size={20} className="mr-2" />
          Image/Logo Upload (Assets Tab)
        </button>
      </div>
    </div>
  );
}