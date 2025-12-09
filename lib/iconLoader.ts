import { IconifyJSON, IconifyIcon } from '@iconify/types';
import { getIconData } from '@iconify/utils';

// Import icon sets
import lucideIcons from '@iconify-json/lucide/icons.json';
import mdiIcons from '@iconify-json/mdi/icons.json';
import fa6SolidIcons from '@iconify-json/fa6-solid/icons.json';
import fa6BrandsIcons from '@iconify-json/fa6-brands/icons.json';

// Define available icon sets
const iconSets: Record<string, IconifyJSON> = {
    lucide: lucideIcons as any,
    mdi: mdiIcons as any,
    fa6: fa6SolidIcons as any,
    'fa6-brands': fa6BrandsIcons as any,
};

export interface IconData {
    body: string;
    width: number;
    height: number;
}

/**
 * Retrieves the SVG body and dimensions for a given icon name.
 * Supports "prefix:name" format. Defaults to "lucide" if no prefix is provided.
 */
export const getIcon = (iconName: string): IconData | null => {
    if (!iconName) return null;

    let prefix = 'lucide';
    let name = iconName;

    if (iconName.includes(':')) {
        const parts = iconName.split(':');
        prefix = parts[0];
        name = parts[1];
    }

    // Normalize name to kebab-case for Lucide (and most others)
    // e.g. "MessageCircle" -> "message-circle"
    // But only if it looks like PascalCase and doesn't contain dashes
    if (!name.includes('-') && /[A-Z]/.test(name)) {
        name = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    } else {
        name = name.toLowerCase();
    }

    const iconSet = iconSets[prefix];
    if (!iconSet) {
        console.warn(`Icon set '${prefix}' not found.`);
        return null;
    }

    const iconData = getIconData(iconSet, name);
    if (!iconData) {
        // console.warn(`Icon '${name}' not found in set '${prefix}'.`);
        return null;
    }

    return {
        body: iconData.body,
        width: iconData.width || 24,
        height: iconData.height || 24,
    };
};

/**
 * Returns a list of all available icons for the picker.
 * Returns an array of { prefix, name } objects.
 */
export const getAllIcons = () => {
    const allIcons: { prefix: string; name: string; }[] = [];

    Object.entries(iconSets).forEach(([prefix, iconSet]) => {
        Object.keys(iconSet.icons).forEach(name => {
            allIcons.push({ prefix, name });
        });
    });

    return allIcons;
};

/**
 * Returns a list of icons filtered by a search query.
 */
export const searchIcons = (query: string, limit = 100) => {
    const results: { prefix: string; name: string; }[] = [];
    const lowerQuery = query.toLowerCase();

    // Iterate through sets
    for (const [prefix, iconSet] of Object.entries(iconSets)) {
        const iconNames = Object.keys(iconSet.icons);

        for (const name of iconNames) {
            if (name.toLowerCase().includes(lowerQuery)) {
                results.push({ prefix, name });
                if (results.length >= limit) return results;
            }
        }
    }

    return results;
};

import { IconProps } from '@/types/template';

/**
 * Generates the default props for a new Icon layer.
 */
export const getDefaultIconProps = (iconName: string): Partial<IconProps> => ({
    // Base Node Props
    x: 100,
    y: 100,
    width: 60,
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

    data: '',

    // CRITICAL: Initialize scale for proper transform handling
    scaleX: 1,
    scaleY: 1,
} as any); // Cast to any to allow scaleX/scaleY which aren't in IconProps interface

