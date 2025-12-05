/**
 * Script to parse shapes.txt and generate shapes-library.json
 * Run with: node scripts/parse-shapes.js
 */

const fs = require('fs');
const path = require('path');

// Color adjustment functions (duplicated from lib for Node.js compatibility)
function getLuminance(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function adjustColor(hexColor) {
    if (getLuminance(hexColor) <= 0.65) return hexColor;

    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const [h, s, l] = rgbToHsl(r, g, b);
    const targetLightness = s > 50 ? 40 : 35;
    const [newR, newG, newB] = hslToRgb(h, s, targetLightness);
    return rgbToHex(newR, newG, newB);
}

// Auto-categorize based on shape characteristics
function categorizeShape(pathData, fill, stroke) {
    const data = pathData.toLowerCase();

    // Geometric patterns
    if (data.includes('m0 0') && data.includes('h') && data.includes('v')) {
        return 'geometric';
    }

    // Stars and sparkles (multiple points radiating)
    if (data.match(/l.*l.*l.*l.*l/i) && data.includes('z')) {
        return 'stars';
    }

    // Organic/curved shapes (bezier curves)
    if (data.includes('c') || data.includes('q') || data.includes('a')) {
        return 'organic';
    }

    // Decorative (complex paths with fills)
    if (fill && fill !== 'none' && data.length > 200) {
        return 'decorative';
    }

    // Simple shapes
    if (data.length < 100) {
        return 'simple';
    }

    return 'misc';
}

// Generate descriptive name based on visual characteristics
function generateShapeName(index, category, pathData) {
    const names = {
        geometric: ['Grid', 'Pattern', 'Tiles', 'Blocks', 'Squares', 'Diamond'],
        stars: ['Star', 'Sparkle', 'Burst', 'Radial', 'Sunburst'],
        organic: ['Flower', 'Petal', 'Wave', 'Blob', 'Cloud', 'Leaf'],
        decorative: ['Ornament', 'Badge', 'Emblem', 'Seal', 'Medallion'],
        simple: ['Shape', 'Form', 'Element'],
        misc: ['Design', 'Symbol', 'Icon']
    };

    const categoryNames = names[category] || names.misc;
    const nameIndex = index % categoryNames.length;
    return `${categoryNames[nameIndex]} ${Math.floor(index / categoryNames.length) + 1}`;
}

// Main parsing function
function parseShapesFile() {
    const shapesPath = path.join(__dirname, '..', 'public', 'shapes', 'shapes.txt');
    const content = fs.readFileSync(shapesPath, 'utf-8');

    // Split by SVG tags
    const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
    const svgMatches = content.match(svgRegex);

    if (!svgMatches) {
        console.error('No SVG elements found!');
        return;
    }

    console.log(`Found ${svgMatches.length} SVG shapes`);

    const shapes = [];
    const categories = {};

    svgMatches.forEach((svgString, index) => {
        const id = `shape-${String(index + 1).padStart(3, '0')}`;

        // Extract viewBox
        const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
        const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 200 200';

        // Extract path data
        const pathMatch = svgString.match(/<path[^>]*d="([^"]*)"/);
        const pathData = pathMatch ? pathMatch[1] : '';

        // Extract transform
        const transformMatch = svgString.match(/transform="([^"]*)"/);
        const transform = transformMatch ? transformMatch[1] : '';

        // Extract fill
        const fillMatch = svgString.match(/fill="([^"]*)"/);
        const originalFill = fillMatch ? fillMatch[1] : '#333333';

        // Extract stroke
        const strokeMatch = svgString.match(/stroke="([^"]*)"/);
        const originalStroke = strokeMatch ? strokeMatch[1] : originalFill;

        // Extract stroke-width
        const strokeWidthMatch = svgString.match(/stroke-width="([^"]*)"/);
        const strokeWidth = strokeWidthMatch ? parseFloat(strokeWidthMatch[1]) : 1;

        // Extract opacity
        const opacityMatch = svgString.match(/opacity="([^"]*)"/);
        const opacity = opacityMatch ? parseFloat(opacityMatch[1]) : 1;

        // Adjust colors for light background
        const displayFill = adjustColor(originalFill);
        const displayStroke = adjustColor(originalStroke);

        // Categorize
        const category = categorizeShape(pathData, originalFill, originalStroke);

        // Generate name
        const name = generateShapeName(index, category, pathData);

        const shape = {
            id,
            name,
            category,
            pathData,
            viewBox,
            transform,
            originalFill,
            displayFill,
            originalStroke,
            displayStroke,
            strokeWidth,
            opacity,
            defaultWidth: 100,
            defaultHeight: 100
        };

        shapes.push(shape);

        // Add to category index
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(id);
    });

    // Create final JSON structure
    const library = {
        version: '1.0.0',
        totalShapes: shapes.length,
        shapes,
        categories
    };

    // Write to file
    const outputPath = path.join(__dirname, '..', 'public', 'shapes', 'shapes-library.json');
    fs.writeFileSync(outputPath, JSON.stringify(library, null, 2));

    console.log(`✓ Generated shapes-library.json with ${shapes.length} shapes`);
    console.log(`✓ Categories: ${Object.keys(categories).join(', ')}`);
    Object.entries(categories).forEach(([cat, ids]) => {
        console.log(`  - ${cat}: ${ids.length} shapes`);
    });
}

// Run the parser
try {
    parseShapesFile();
} catch (error) {
    console.error('Error parsing shapes:', error);
    process.exit(1);
}
