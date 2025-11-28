const fs = require('fs');
const path = require('path');

const logosDir = path.join(__dirname, '../public/logos');
const outputFile = path.join(__dirname, '../lib/logoIndex.ts');

const logos = [];

try {
    const dirs = fs.readdirSync(logosDir).filter(f => f.startsWith('LogoTaco_Logo-'));

    dirs.forEach(dir => {
        const logoNum = dir.match(/Logo-(\d+)/)[1];
        const svgDir = path.join(logosDir, dir, 'SVG');

        if (fs.existsSync(svgDir)) {
            const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));
            const variants = files.map(file => {
                // Filename format: Logo{N}_{Color}.svg
                // e.g. Logo1_Black.svg
                const match = file.match(/Logo\d+_([a-zA-Z-]+)\.svg/);
                const colorName = match ? match[1] : 'Unknown';

                return {
                    color: colorName,
                    path: `/logos/${dir}/SVG/${file}`
                };
            });

            logos.push({
                id: `logo_${logoNum}`,
                name: `Logo ${logoNum}`,
                variants: variants
            });
        }
    });

    const content = `export type LogoVariant = {
  color: string;
  path: string;
};

export type LogoFamily = {
  id: string;
  name: string;
  variants: LogoVariant[];
};

export const AVAILABLE_LOGOS: LogoFamily[] = ${JSON.stringify(logos, null, 2)};
`;

    fs.writeFileSync(outputFile, content);
    console.log(`Generated logo index with ${logos.length} logos.`);

} catch (err) {
    console.error('Error generating logo index:', err);
}
