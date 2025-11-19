// lib/complex-shapes.ts
// PHASE 3 UPGRADE: Registry for Complex SVG Paths (Blobs, Shields, Ornaments)

import { 
  Shapes, 
  Flower, 
  Shield, 
  Zap, 
  Cloud, 
  Hexagon, 
  MessageSquare 
} from 'lucide-react'; 
import { LucideIcon } from 'lucide-react';
import { ComplexShapeProps } from '@/types/template';

// 1. Type Definitions for the Shape Library
export interface ComplexShapeDefinition {
  name: string;
  icon: LucideIcon; // Used for the Sidebar UI thumbnail
  defaultProps: Partial<ComplexShapeProps>;
}

// 2. Real SVG Path Data
// These paths are normalized (roughly centered or top-left aligned).
// Konva handles scaling, but defining them clearly ensures good initial rendering.

const PATHS = {
  // A fluid, organic blob shape
  BLOB_1: "M45.7,-53.6C58.9,-43.3,69.1,-29.3,73.3,-13.6C77.5,2.1,75.7,19.5,66.6,34.2C57.5,48.9,41.1,60.9,23.7,67.7C6.3,74.5,-12.1,76.1,-28.2,70.2C-44.3,64.3,-58.1,50.9,-65.8,35.2C-73.5,19.5,-75.1,1.5,-69.7,-13.6C-64.3,-28.7,-51.9,-40.9,-38.4,-51.1C-24.9,-61.3,-10.3,-69.5,3,-73.1C16.3,-76.7,29.6,-75.7,45.7,-53.6Z",
  
  // A classic shield/badge
  SHIELD: "M12 2L2 7l10 13 10-13-10-5z", // Simplified shield path
  
  // A multi-point starburst (useful for "SALE" or "NEW" tags)
  STARBURST: "M 100 10 L 120 60 L 170 50 L 140 90 L 180 130 L 130 140 L 140 190 L 100 150 L 60 190 L 70 140 L 20 130 L 60 90 L 30 50 L 80 60 Z",
  
  // A decorative floral element
  FLOWER_SIMPLE: "M12 2L14.5 9H21.5L16 13L18 20L12 16L6 20L8 13L2.5 9H9.5L12 2Z", // Actually a star/flower hybrid
  
  // A speech bubble tail
  BUBBLE_TAIL: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  
  // A squircle (superellipse)
  SQUIRCLE: "M 0,50 C 0,0 0,0 50,0 S 100,0 100,50 100,100 50,100 0,100 0,50",
};

// 3. The Shape Registry
export const COMPLEX_SHAPE_DEFINITIONS: ComplexShapeDefinition[] = [
  {
    name: 'Organic Blob',
    icon: Cloud, // Visual proxy
    defaultProps: {
      category: 'ComplexShape',
      data: PATHS.BLOB_1,
      fill: '#FF6B6B', 
      width: 150, 
      height: 150,
      // Path data is often centered around 0,0. 
      // x,y usually need to be set on the stage.
    }
  },
  {
    name: 'Badge Shield',
    icon: Shield,
    defaultProps: {
      category: 'ComplexShape',
      data: PATHS.SHIELD,
      fill: '#4ECDC4',
      width: 240, // Bounding box approximation
      height: 240,
    }
  },
  {
    name: 'Starburst',
    icon: Zap,
    defaultProps: {
      category: 'ComplexShape',
      data: PATHS.STARBURST,
      fill: '#FFE66D',
      stroke: '#000000',
      strokeWidth: 2,
      width: 200,
      height: 200,
    }
  },
  {
    name: 'Message Bubble',
    icon: MessageSquare,
    defaultProps: {
      category: 'ComplexShape',
      data: PATHS.BUBBLE_TAIL,
      fill: '#F7F7F7',
      stroke: '#333333',
      strokeWidth: 1,
      width: 180,
      height: 180,
    }
  },
  {
    name: 'Squircle Frame',
    icon: Hexagon,
    defaultProps: {
      category: 'ComplexShape',
      data: PATHS.SQUIRCLE,
      fill: 'transparent',
      stroke: '#292F36',
      strokeWidth: 4,
      width: 100,
      height: 100,
    }
  }
];

/**
 * Helper to get safe default props for a complex shape
 * Ensures the 'category' is strictly typed for the renderer.
 */
export const getComplexShapeProps = (shapeName: string): Partial<ComplexShapeProps> | null => {
  const def = COMPLEX_SHAPE_DEFINITIONS.find(s => s.name === shapeName);
  if (!def) return null;

  return {
    x: 100,
    y: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    ...def.defaultProps, // Merges specific path data and colors
  };
};