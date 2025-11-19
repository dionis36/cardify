// lib/icon-data.ts
// PHASE 3 UPGRADE: Centralized Icon Registry and Data Definitions

import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { IconProps } from '@/types/template';

// 1. Type Definitions for the Library
export type IconCategory = 
  | 'Essentials' 
  | 'Business' 
  | 'Social' 
  | 'Tech' 
  | 'Arrows' 
  | 'Layout' 
  | 'Nature'
  | 'Shapes';

export interface IconDefinition {
  name: string; // The PascalCase name matching Lucide export
  icon: LucideIcon; // The React component (for UI previews)
  category: IconCategory;
  tags: string[]; // Keywords for the search algorithm
}

// 2. Robust Icon Registry (Representative Subset of Lucide)
export const ICON_DEFINITIONS: IconDefinition[] = [
  // --- ESSENTIALS ---
  { name: 'Home', icon: LucideIcons.Home, category: 'Essentials', tags: ['house', 'main', 'start'] },
  { name: 'Search', icon: LucideIcons.Search, category: 'Essentials', tags: ['find', 'magnify'] },
  { name: 'Menu', icon: LucideIcons.Menu, category: 'Essentials', tags: ['hamburger', 'list'] },
  { name: 'Settings', icon: LucideIcons.Settings, category: 'Essentials', tags: ['gear', 'config'] },
  { name: 'User', icon: LucideIcons.User, category: 'Essentials', tags: ['profile', 'person', 'account'] },
  { name: 'Bell', icon: LucideIcons.Bell, category: 'Essentials', tags: ['notification', 'alarm'] },
  { name: 'Mail', icon: LucideIcons.Mail, category: 'Essentials', tags: ['email', 'message'] },
  { name: 'Trash', icon: LucideIcons.Trash, category: 'Essentials', tags: ['delete', 'remove'] },
  { name: 'Star', icon: LucideIcons.Star, category: 'Essentials', tags: ['favorite', 'rate'] },
  { name: 'Heart', icon: LucideIcons.Heart, category: 'Essentials', tags: ['like', 'love'] },

  // --- BUSINESS ---
  { name: 'Briefcase', icon: LucideIcons.Briefcase, category: 'Business', tags: ['work', 'job', 'office'] },
  { name: 'CreditCard', icon: LucideIcons.CreditCard, category: 'Business', tags: ['payment', 'money'] },
  { name: 'DollarSign', icon: LucideIcons.DollarSign, category: 'Business', tags: ['money', 'cost'] },
  { name: 'PieChart', icon: LucideIcons.PieChart, category: 'Business', tags: ['analytics', 'data'] },
  { name: 'TrendingUp', icon: LucideIcons.TrendingUp, category: 'Business', tags: ['growth', 'stats'] },
  { name: 'Target', icon: LucideIcons.Target, category: 'Business', tags: ['goal', 'objective'] },
  { name: 'Award', icon: LucideIcons.Award, category: 'Business', tags: ['prize', 'achievement'] },
  { name: 'Calendar', icon: LucideIcons.Calendar, category: 'Business', tags: ['date', 'schedule'] },
  { name: 'Phone', icon: LucideIcons.Phone, category: 'Business', tags: ['call', 'contact'] },

  // --- SOCIAL ---
  { name: 'Share2', icon: LucideIcons.Share2, category: 'Social', tags: ['network', 'connect'] },
  { name: 'MessageCircle', icon: LucideIcons.MessageCircle, category: 'Social', tags: ['chat', 'comment'] },
  { name: 'ThumbsUp', icon: LucideIcons.ThumbsUp, category: 'Social', tags: ['like', 'approve'] },
  { name: 'Instagram', icon: LucideIcons.Instagram, category: 'Social', tags: ['photo', 'media'] },
  { name: 'Facebook', icon: LucideIcons.Facebook, category: 'Social', tags: ['media', 'network'] },
  { name: 'Twitter', icon: LucideIcons.Twitter, category: 'Social', tags: ['tweet', 'media'] },
  { name: 'Linkedin', icon: LucideIcons.Linkedin, category: 'Social', tags: ['professional', 'network'] },
  { name: 'Youtube', icon: LucideIcons.Youtube, category: 'Social', tags: ['video', 'stream'] },
  { name: 'Globe', icon: LucideIcons.Globe, category: 'Social', tags: ['web', 'world'] },

  // --- TECH ---
  { name: 'Wifi', icon: LucideIcons.Wifi, category: 'Tech', tags: ['internet', 'connection'] },
  { name: 'Battery', icon: LucideIcons.Battery, category: 'Tech', tags: ['power', 'energy'] },
  { name: 'Bluetooth', icon: LucideIcons.Bluetooth, category: 'Tech', tags: ['connect', 'wireless'] },
  { name: 'Cpu', icon: LucideIcons.Cpu, category: 'Tech', tags: ['processor', 'chip'] },
  { name: 'Database', icon: LucideIcons.Database, category: 'Tech', tags: ['storage', 'server'] },
  { name: 'Smartphone', icon: LucideIcons.Smartphone, category: 'Tech', tags: ['mobile', 'device'] },
  { name: 'Monitor', icon: LucideIcons.Monitor, category: 'Tech', tags: ['screen', 'display'] },
  { name: 'Laptop', icon: LucideIcons.Laptop, category: 'Tech', tags: ['computer', 'device'] },

  // --- ARROWS ---
  { name: 'ArrowRight', icon: LucideIcons.ArrowRight, category: 'Arrows', tags: ['direction', 'next'] },
  { name: 'ArrowLeft', icon: LucideIcons.ArrowLeft, category: 'Arrows', tags: ['direction', 'back'] },
  { name: 'ChevronDown', icon: LucideIcons.ChevronDown, category: 'Arrows', tags: ['expand', 'menu'] },
  { name: 'ChevronUp', icon: LucideIcons.ChevronUp, category: 'Arrows', tags: ['collapse', 'menu'] },
  { name: 'RefreshCcw', icon: LucideIcons.RefreshCcw, category: 'Arrows', tags: ['reload', 'sync'] },
  { name: 'Download', icon: LucideIcons.Download, category: 'Arrows', tags: ['save', 'get'] },
  { name: 'Upload', icon: LucideIcons.Upload, category: 'Arrows', tags: ['send', 'put'] },

  // --- LAYOUT ---
  { name: 'LayoutGrid', icon: LucideIcons.LayoutGrid, category: 'Layout', tags: ['structure', 'grid'] },
  { name: 'List', icon: LucideIcons.List, category: 'Layout', tags: ['items', 'details'] },
  { name: 'Maximize', icon: LucideIcons.Maximize, category: 'Layout', tags: ['expand', 'full'] },
  { name: 'Minimize', icon: LucideIcons.Minimize, category: 'Layout', tags: ['shrink', 'small'] },
  { name: 'Layers', icon: LucideIcons.Layers, category: 'Layout', tags: ['stack', 'order'] },

  // --- NATURE ---
  { name: 'Sun', icon: LucideIcons.Sun, category: 'Nature', tags: ['light', 'day'] },
  { name: 'Moon', icon: LucideIcons.Moon, category: 'Nature', tags: ['dark', 'night'] },
  { name: 'Cloud', icon: LucideIcons.Cloud, category: 'Nature', tags: ['weather', 'sky'] },
  { name: 'Zap', icon: LucideIcons.Zap, category: 'Nature', tags: ['lightning', 'power'] },
  { name: 'Flame', icon: LucideIcons.Flame, category: 'Nature', tags: ['fire', 'hot'] },
];

/**
 * Helper to retrieve the actual Lucide component by name string
 */
export const getIconComponent = (iconName: string): LucideIcon => {
  // Cast to any to access generic property
  const icon = (LucideIcons as any)[iconName];
  return icon || LucideIcons.HelpCircle; // Fallback
};

/**
 * Generates the default props for a new Icon layer.
 * Note: 'data' (SVG Path) is initialized as empty or a placeholder.
 * The IconNode renderer is responsible for resolving the path at runtime
 * or the editor should populate it upon creation if 'data' is strictly required.
 */
export const getDefaultIconProps = (iconName: string): Partial<IconProps> => ({
    // Base Node Props
    x: 100,
    y: 100,
    width: 60, // Icons often look better starting slightly larger than 32
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    
    // Icon Specifics
    category: 'Icon', 
    iconName: iconName,
    
    // Styling Defaults
    fill: '#000000',
    stroke: 'transparent',
    strokeWidth: 0,
    
    // Data Placeholder: The Konva IconNode will likely need to derive this 
    // from the iconName if it's rendering a native Path.
    // For now, we leave it empty or could insert a generic box path.
    data: '', 
});