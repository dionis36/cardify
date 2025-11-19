// lib/backgroundPatterns.ts
// PHASE 3 UPGRADE: Robust Background Presets with Inline SVG Patterns

import { BackgroundPattern, BackgroundType } from '@/types/template';

// Helper interface for UI lists (adds ID and Name to the raw Pattern state)
export interface BackgroundPreset {
  id: string;
  name: string;
  pattern: BackgroundPattern;
}

// --- UTILITIES: SVG DATA URIs (Instant Rendering) ---

// Simple Dot Grid (Gray on Transparent)
const DOT_PATTERN_URI = `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E`;

// Diagonal Lines
const DIAGONAL_PATTERN_URI = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

// Grid Lines
const GRID_PATTERN_URI = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23cccccc' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E`;

// --- 1. SOLID COLORS ---

export const SOLID_PRESETS: BackgroundPreset[] = [
  {
    id: 'bg-white',
    name: 'Pure White',
    pattern: {
      type: 'solid',
      color1: '#FFFFFF',
      opacity: 1,
    }
  },
  {
    id: 'bg-slate-50',
    name: 'Soft Gray',
    pattern: {
      type: 'solid',
      color1: '#F8FAFC', // Slate 50
      opacity: 1,
    }
  },
  {
    id: 'bg-slate-900',
    name: 'Dark Mode',
    pattern: {
      type: 'solid',
      color1: '#0F172A', // Slate 900
      opacity: 1,
    }
  },
  {
    id: 'bg-blue-100',
    name: 'Pale Blue',
    pattern: {
      type: 'solid',
      color1: '#DBEAFE', // Blue 100
      opacity: 1,
    }
  },
];

// --- 2. GRADIENTS ---

export const GRADIENT_PRESETS: BackgroundPreset[] = [
  {
    id: 'grad-sunset',
    name: 'Sunset',
    pattern: {
      type: 'gradient',
      color1: '#F59E0B', // Amber
      color2: '#EF4444', // Red
      rotation: 45,
      opacity: 1,
    }
  },
  {
    id: 'grad-ocean',
    name: 'Ocean Breeze',
    pattern: {
      type: 'gradient',
      color1: '#06B6D4', // Cyan
      color2: '#3B82F6', // Blue
      rotation: 90,
      opacity: 1,
    }
  },
  {
    id: 'grad-purple',
    name: 'Mystic Purple',
    pattern: {
      type: 'gradient',
      color1: '#8B5CF6', // Violet
      color2: '#EC4899', // Pink
      rotation: 135,
      opacity: 1,
    }
  },
  {
    id: 'grad-midnight',
    name: 'Midnight',
    pattern: {
      type: 'gradient',
      color1: '#1E293B', // Slate 800
      color2: '#0F172A', // Slate 900
      rotation: 180,
      opacity: 1,
    }
  },
];

// --- 3. SEAMLESS PATTERNS ---

export const PATTERN_PRESETS: BackgroundPreset[] = [
  {
    id: 'pat-dots',
    name: 'Dot Grid',
    pattern: {
      type: 'pattern',
      color1: '#ffffff', // Background Color
      patternImageURL: DOT_PATTERN_URI,
      scale: 1,
      opacity: 1,
    }
  },
  {
    id: 'pat-diagonal',
    name: 'Diagonal Lines',
    pattern: {
      type: 'pattern',
      color1: '#f8fafc',
      patternImageURL: DIAGONAL_PATTERN_URI,
      scale: 1,
      opacity: 1,
    }
  },
  {
    id: 'pat-grid',
    name: 'Technical Grid',
    pattern: {
      type: 'pattern',
      color1: '#ffffff',
      patternImageURL: GRID_PATTERN_URI,
      scale: 1,
      opacity: 1,
    }
  },
];

// --- DEFAULT STARTING STATE ---

export const DEFAULT_BACKGROUND: BackgroundPattern = {
  type: 'solid',
  color1: '#FFFFFF',
  opacity: 1,
};