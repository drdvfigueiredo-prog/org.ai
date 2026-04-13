// Simple icon generator using canvas-like SVG
const fs = require('fs');

function createSVGIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0a0e1a"/>
  <rect x="${size*0.08}" y="${size*0.08}" width="${size*0.84}" height="${size*0.84}" rx="${size*0.16}" fill="#111827" stroke="#2563eb" stroke-width="${size*0.02}"/>
  <text x="${size/2}" y="${size*0.48}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="${size*0.22}" fill="#f1f5f9">ORG</text>
  <text x="${size*0.66}" y="${size*0.48}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="${size*0.22}" fill="#2563eb">.</text>
  <text x="${size/2}" y="${size*0.72}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="${size*0.18}" fill="#2563eb">AI</text>
</svg>`;
}

fs.writeFileSync('public/icon-192.svg', createSVGIcon(192));
fs.writeFileSync('public/icon-512.svg', createSVGIcon(512));
console.log('SVG icons created');
