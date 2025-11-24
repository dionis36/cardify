// lib/backgroundPatterns.ts
// PHASE 3 UPGRADE: Robust Background Presets with Inline SVG Patterns

import { BackgroundPattern, BackgroundType } from '@/types/template';

// Helper interface for UI lists (adds ID and Name to the raw Pattern state)
export interface BackgroundPreset {
  id: string;
  name: string;
  pattern: BackgroundPattern;
}

// --- UTILITIES: SVG GENERATORS (Dynamic Color Support) ---

const encodeColor = (color: string) => encodeURIComponent(color);

export const PATTERN_GENERATORS = {
  dots: (color: string) => `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodeColor(color)}' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E`,
  diagonal: (color: string) => `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='${encodeColor(color)}' fill-opacity='0.4'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`,
  grid: (color: string) => `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='${encodeColor(color)}' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E`,
  chevron: (color: string) => `data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 18.26l-6.2-6.2 1.4-1.42 4.8 4.8 4.8-4.8 1.4 1.42z' fill='${encodeColor(color)}' fill-opacity='0.4'/%3E%3C/svg%3E`,
  hexagon: (color: string) => `data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z' fill='${encodeColor(color)}' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E`,
  triangle: (color: string) => `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 5l10 20H10z' fill='${encodeColor(color)}' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E`,
  zigzag: (color: string) => `data:image/svg+xml,%3Csvg width='40' height='12' viewBox='0 0 40 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 12l10-10 10 10 10-10 10 10' stroke='${encodeColor(color)}' stroke-opacity='0.4' fill='none'/%3E%3C/svg%3E`,
  circle: (color: string) => `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='10' fill='${encodeColor(color)}' fill-opacity='0.2'/%3E%3C/svg%3E`,
  plus: (color: string) => `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10v20M10 20h20' stroke='${encodeColor(color)}' stroke-opacity='0.4' stroke-width='2'/%3E%3C/svg%3E`,
  waves: (color: string) => `data:image/svg+xml,%3Csvg width='40' height='10' viewBox='0 0 40 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 5c5 0 5-5 10-5s5 5 10 5 5-5 10-5 5 5 10 5' stroke='${encodeColor(color)}' stroke-opacity='0.4' fill='none'/%3E%3C/svg%3E`,
  leaves: (color: string) => `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 40c11.046 0 20-8.954 20-20S31.046 0 20 0 0 8.954 0 20s8.954 20 20 20zm0-35c8.284 0 15 6.716 15 15s-6.716 15-15 15-15-6.716-15-15 6.716-15 15-15z' fill='${encodeColor(color)}' fill-opacity='0.2'/%3E%3C/svg%3E`,
  clouds: (color: string) => `data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 32c0-8.837 7.163-16 16-16s16 7.163 16 16-7.163 16-16 16-16-7.163-16-16z' fill='${encodeColor(color)}' fill-opacity='0.2'/%3E%3C/svg%3E`,

  // Textures (Static for now, but could be dynamic)
  noise: (color: string) => `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E`,
  paper: (color: string) => `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperFilter)' opacity='0.4'/%3E%3C/svg%3E`,
};

// Default pattern color
const DEF_PAT_COLOR = '#9C92AC';

// --- 1. SOLID COLORS ---

export const SOLID_PRESETS: BackgroundPreset[] = [
  { id: 'bg-white', name: 'Pure White', pattern: { type: 'solid', color1: '#FFFFFF', opacity: 1 } },
  { id: 'bg-slate-50', name: 'Soft Gray', pattern: { type: 'solid', color1: '#F8FAFC', opacity: 1 } },
  { id: 'bg-slate-900', name: 'Dark Mode', pattern: { type: 'solid', color1: '#0F172A', opacity: 1 } },
  { id: 'bg-blue-100', name: 'Pale Blue', pattern: { type: 'solid', color1: '#DBEAFE', opacity: 1 } },
  { id: 'bg-red-100', name: 'Pale Red', pattern: { type: 'solid', color1: '#FEE2E2', opacity: 1 } },
  { id: 'bg-green-100', name: 'Pale Green', pattern: { type: 'solid', color1: '#DCFCE7', opacity: 1 } },
  { id: 'bg-yellow-100', name: 'Pale Yellow', pattern: { type: 'solid', color1: '#FEF9C3', opacity: 1 } },
  { id: 'bg-purple-100', name: 'Pale Purple', pattern: { type: 'solid', color1: '#F3E8FF', opacity: 1 } },
  { id: 'bg-orange-100', name: 'Pale Orange', pattern: { type: 'solid', color1: '#FFEDD5', opacity: 1 } },
  { id: 'bg-teal-100', name: 'Pale Teal', pattern: { type: 'solid', color1: '#CCFBF1', opacity: 1 } },
  { id: 'bg-indigo-100', name: 'Pale Indigo', pattern: { type: 'solid', color1: '#E0E7FF', opacity: 1 } },
  { id: 'bg-rose-100', name: 'Pale Rose', pattern: { type: 'solid', color1: '#FFE4E6', opacity: 1 } },
  { id: 'bg-black', name: 'Pure Black', pattern: { type: 'solid', color1: '#000000', opacity: 1 } },
  { id: 'bg-gray-500', name: 'Mid Gray', pattern: { type: 'solid', color1: '#6B7280', opacity: 1 } },
];

// --- 2. GRADIENTS ---

export const GRADIENT_PRESETS: BackgroundPreset[] = [
  {
    id: 'grad-sunset',
    name: 'Sunset',
    pattern: {
      type: 'gradient',
      color1: '#F59E0B',
      color2: '#EF4444',
      gradientType: 'linear',
      gradientStops: [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: '#EF4444' }],
      rotation: 45,
      opacity: 1,
    }
  },
  {
    id: 'grad-ocean',
    name: 'Ocean Breeze',
    pattern: {
      type: 'gradient',
      color1: '#06B6D4',
      color2: '#3B82F6',
      gradientType: 'linear',
      gradientStops: [{ offset: 0, color: '#06B6D4' }, { offset: 1, color: '#3B82F6' }],
      rotation: 90,
      opacity: 1,
    }
  },
  {
    id: 'grad-purple',
    name: 'Mystic Purple',
    pattern: {
      type: 'gradient',
      color1: '#8B5CF6',
      color2: '#EC4899',
      gradientType: 'linear',
      gradientStops: [{ offset: 0, color: '#8B5CF6' }, { offset: 1, color: '#EC4899' }],
      rotation: 135,
      opacity: 1,
    }
  },
  {
    id: 'grad-midnight',
    name: 'Midnight',
    pattern: {
      type: 'gradient',
      color1: '#1E293B',
      color2: '#0F172A',
      gradientType: 'linear',
      gradientStops: [{ offset: 0, color: '#1E293B' }, { offset: 1, color: '#0F172A' }],
      rotation: 180,
      opacity: 1,
    }
  },
  {
    id: 'grad-neon',
    name: 'Neon Lights',
    pattern: {
      type: 'gradient',
      color1: '#F472B6',
      color2: '#4ADE80',
      gradientType: 'linear',
      gradientStops: [{ offset: 0, color: '#F472B6' }, { offset: 0.5, color: '#A78BFA' }, { offset: 1, color: '#4ADE80' }],
      rotation: 45,
      opacity: 1,
    }
  },
  {
    id: 'grad-radial-sun',
    name: 'Sunburst',
    pattern: {
      type: 'gradient',
      color1: '#FEF3C7',
      color2: '#F59E0B',
      gradientType: 'radial',
      gradientStops: [{ offset: 0, color: '#FEF3C7' }, { offset: 1, color: '#F59E0B' }],
      rotation: 0,
      opacity: 1,
    }
  },
  {
    id: 'grad-radial-void',
    name: 'The Void',
    pattern: {
      type: 'gradient',
      color1: '#334155',
      color2: '#020617',
      gradientType: 'radial',
      gradientStops: [{ offset: 0, color: '#334155' }, { offset: 1, color: '#020617' }],
      rotation: 0,
      opacity: 1,
    }
  },
  {
    id: 'grad-forest',
    name: 'Deep Forest',
    pattern: {
      type: 'gradient',
      color1: '#14532d',
      color2: '#166534',
      gradientType: 'linear',
      gradientStops: [{ offset: 0, color: '#052e16' }, { offset: 1, color: '#15803d' }],
      rotation: 120,
      opacity: 1,
    }
  },
  {
    id: 'grad-fire',
    name: 'Fire',
    pattern: {
      type: 'gradient',
      color1: '#fef08a',
      color2: '#b91c1c',
      gradientType: 'linear',
      gradientStops: [{ offset: 0, color: '#fef08a' }, { offset: 0.5, color: '#f97316' }, { offset: 1, color: '#b91c1c' }],
      rotation: 0,
      opacity: 1,
    }
  },
  {
    id: 'grad-sky',
    name: 'Clear Sky',
    pattern: {
      type: 'gradient',
      color1: '#bae6fd',
      color2: '#3b82f6',
      gradientType: 'linear',
      gradientStops: [{ offset: 0, color: '#e0f2fe' }, { offset: 1, color: '#0ea5e9' }],
      rotation: 180,
      opacity: 1,
    }
  },
];

// --- 3. SEAMLESS PATTERNS ---

export const PATTERN_PRESETS: BackgroundPreset[] = [
  { id: 'pat-dots', name: 'Dot Grid', pattern: { type: 'pattern', color1: '#ffffff', patternId: 'dots', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.dots(DEF_PAT_COLOR), scale: 1, opacity: 1 } },
  { id: 'pat-diagonal', name: 'Diagonal Lines', pattern: { type: 'pattern', color1: '#f8fafc', patternId: 'diagonal', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.diagonal(DEF_PAT_COLOR), scale: 1, opacity: 1 } },
  { id: 'pat-grid', name: 'Technical Grid', pattern: { type: 'pattern', color1: '#ffffff', patternId: 'grid', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.grid(DEF_PAT_COLOR), scale: 1, opacity: 1 } },
  { id: 'pat-chevron', name: 'Chevron', pattern: { type: 'pattern', color1: '#f0f9ff', patternId: 'chevron', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.chevron(DEF_PAT_COLOR), scale: 1, opacity: 1 } },
  { id: 'pat-hexagon', name: 'Hexagon', pattern: { type: 'pattern', color1: '#fdf4ff', patternId: 'hexagon', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.hexagon(DEF_PAT_COLOR), scale: 1.5, opacity: 1 } },
  { id: 'pat-triangle', name: 'Triangles', pattern: { type: 'pattern', color1: '#fff7ed', patternId: 'triangle', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.triangle(DEF_PAT_COLOR), scale: 1, opacity: 1 } },
  { id: 'pat-zigzag', name: 'ZigZag', pattern: { type: 'pattern', color1: '#f0fdf4', patternId: 'zigzag', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.zigzag(DEF_PAT_COLOR), scale: 1, opacity: 1 } },
  { id: 'pat-circle', name: 'Circles', pattern: { type: 'pattern', color1: '#eff6ff', patternId: 'circle', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.circle(DEF_PAT_COLOR), scale: 1.2, opacity: 1 } },
  { id: 'pat-plus', name: 'Plus Signs', pattern: { type: 'pattern', color1: '#faf5ff', patternId: 'plus', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.plus(DEF_PAT_COLOR), scale: 0.8, opacity: 1 } },
  { id: 'pat-waves', name: 'Waves', pattern: { type: 'pattern', color1: '#ecfeff', patternId: 'waves', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.waves(DEF_PAT_COLOR), scale: 1, opacity: 1 } },
  { id: 'pat-leaves', name: 'Leaves', pattern: { type: 'pattern', color1: '#f0fdf4', patternId: 'leaves', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.leaves(DEF_PAT_COLOR), scale: 1.5, opacity: 1 } },
  { id: 'pat-clouds', name: 'Clouds', pattern: { type: 'pattern', color1: '#f0f9ff', patternId: 'clouds', patternColor: DEF_PAT_COLOR, patternImageURL: PATTERN_GENERATORS.clouds(DEF_PAT_COLOR), scale: 2, opacity: 1 } },
];

// --- 4. TEXTURES ---

export const TEXTURE_PRESETS: BackgroundPreset[] = [
  { id: 'tex-noise', name: 'Noise', pattern: { type: 'texture', color1: '#ffffff', patternId: 'noise', patternImageURL: PATTERN_GENERATORS.noise('#000000'), scale: 1, opacity: 0.5, overlayColor: '#000000' } },
  { id: 'tex-paper', name: 'Paper', pattern: { type: 'texture', color1: '#ffffff', patternId: 'paper', patternImageURL: PATTERN_GENERATORS.paper('#000000'), scale: 1, opacity: 0.8, overlayColor: '#f5f5dc' } },
];

// --- DEFAULT STARTING STATE ---

export const DEFAULT_BACKGROUND: BackgroundPattern = {
  type: 'solid',
  color1: '#FFFFFF',
  opacity: 1,
};