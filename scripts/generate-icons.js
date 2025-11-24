// Simple script to generate placeholder PWA icons
// In a real project, you'd use proper icon generation tools

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [64, 192, 512];
const publicDir = path.join(__dirname, '..', 'public');

// Create SVG template for WebOS icon
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
        fill="white" text-anchor="middle" dominant-baseline="middle">👋</text>
</svg>
`;

// Generate icons
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `pwa-${size}x${size}.png`;
  
  // For this demo, we'll create SVG files instead of PNG
  // In production, you'd convert SVG to PNG using a tool like sharp
  fs.writeFileSync(
    path.join(publicDir, `pwa-${size}x${size}.svg`), 
    svgContent.trim()
  );
  
  console.log(`Generated ${filename} (as SVG)`);
});

// Create maskable icon
const maskableSVG = createSVGIcon(512).replace('rx="102.4"', 'rx="0"');
fs.writeFileSync(
  path.join(publicDir, 'maskable-icon-512x512.svg'), 
  maskableSVG.trim()
);

console.log('Icon generation complete!');
console.log('Note: In production, convert SVG files to PNG using a proper tool.');
