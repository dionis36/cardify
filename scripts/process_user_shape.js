
const fs = require('fs');

// User's paths
const paths = [
    "M86 20L68 10V30L86 20Z",
    "M68 20L50 10V30L68 20Z",
    "M50 20L32 10V30L50 20Z",
    "M32 20L14 10L14 30L32 20Z",
    "M14 40L32 30L32 50L14 40Z",
    "M32 40L50 30V50L32 40Z",
    "M50 40L68 30V50L50 40Z",
    "M68 40L86 30V50L68 40Z",
    "M86 60L68 50V70L86 60Z",
    "M68 60L50 50V70L68 60Z",
    "M50 60L32 50V70L50 60Z",
    "M32 60L14 50L14 70L32 60Z",
    "M14 80L32 70L32 90L14 80Z",
    "M32 80L50 70V90L32 80Z",
    "M50 80L68 70V90L50 80Z",
    "M68 80L86 70V90L68 80Z"
];

// Transform: translate(975, 61.5) scale(18)
const SCALE = 18;
const TX = 975;
const TY = 61.5;

function transformVal(val, isX) {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return isX ? (num * SCALE + TX) : (num * SCALE + TY);
}

// 1. First pass: Transform coordinates and find Min/Max for normalization
let minX = Infinity, minY = Infinity;
let maxX = -Infinity, maxY = -Infinity;

// Helper to track min/max
function track(x, y) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
}

const tempPaths = paths.map(p => {
    return p.replace(/([MLHVZ])([^MLHVZ]*)/gi, (match, cmd, argsStr) => {
        const args = argsStr.trim().split(/[\s,]+/).filter(x => x !== "").map(parseFloat);
        const upperCmd = cmd.toUpperCase();

        if (upperCmd === 'H') {
            args.forEach(x => {
                const val = transformVal(x, true);
                if (val < minX) minX = val;
                if (val > maxX) maxX = val;
            });
        } else if (upperCmd === 'V') {
            args.forEach(y => {
                const val = transformVal(y, false);
                if (val < minY) minY = val;
                if (val > maxY) maxY = val;
            });
        } else if (upperCmd === 'M' || upperCmd === 'L') {
            for (let i = 0; i < args.length; i += 2) {
                const x = transformVal(args[i], true);
                const y = transformVal(args[i + 1], false);
                track(x, y);
            }
        }
        return ""; // Just pass for min/max tracking
    });
});

// 2. Second pass: Normalize
const normalizedPaths = paths.map(p => {
    return p.replace(/([MLHVZ])([^MLHVZ]*)/gi, (match, cmd, argsStr) => {
        const args = argsStr.trim().split(/[\s,]+/).filter(x => x !== "").map(parseFloat);
        const upperCmd = cmd.toUpperCase();
        let newArgs = [];

        if (upperCmd === 'H') {
            newArgs = args.map(x => transformVal(x, true) - minX);
        } else if (upperCmd === 'V') {
            newArgs = args.map(y => transformVal(y, false) - minY);
        } else if (upperCmd === 'M' || upperCmd === 'L') {
            for (let i = 0; i < args.length; i += 2) {
                newArgs.push(transformVal(args[i], true) - minX);
                newArgs.push(transformVal(args[i + 1], false) - minY);
            }
        } else if (upperCmd === 'Z') {
            return 'Z';
        }
        return cmd + newArgs.join(' ');
    });
});

const width = maxX - minX;
const height = maxY - minY;

const outputPathData = normalizedPaths.map(d => ({ d, fillRule: "nonzero" })); // Simple shapes usually nonzero

const newShape = {
    id: "shape-custom-002",
    name: "Geometric Pattern 1",
    category: "geometric",
    pathData: "",
    paths: outputPathData,
    viewBox: `0 0 ${Math.ceil(width)} ${Math.ceil(height)}`,
    transform: "",
    scaleValue: 1,
    originalFill: "#34495E",
    displayFill: "#34495E",
    originalStroke: "#34495E",
    displayStroke: "#34495E",
    strokeWidth: 1,
    opacity: 1,
    defaultWidth: 120,
    defaultHeight: 120
};

console.log(JSON.stringify(newShape, null, 2));
