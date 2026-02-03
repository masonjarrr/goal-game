import sharp from 'sharp';

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  const fontSize = Math.round(size * 0.35);
  const textY = Math.round(size * 0.72);
  const textSize = Math.round(size * 0.09);
  const rx = name.includes('maskable') ? 0 : Math.round(size * 0.15);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#0a0a0f" rx="${rx}"/>
    <rect x="${size*0.3}" y="${size*0.18}" width="${size*0.06}" height="${size*0.45}" fill="#c8a84e" rx="4"/>
    <rect x="${size*0.64}" y="${size*0.18}" width="${size*0.06}" height="${size*0.45}" fill="#c8a84e" rx="4"/>
    <rect x="${size*0.22}" y="${size*0.15}" width="${size*0.22}" height="${size*0.06}" fill="#c8a84e" rx="3"/>
    <rect x="${size*0.56}" y="${size*0.15}" width="${size*0.22}" height="${size*0.06}" fill="#c8a84e" rx="3"/>
    <rect x="${size*0.35}" y="${size*0.55}" width="${size*0.3}" height="${size*0.04}" fill="#c8a84e" rx="2" transform="rotate(-30 ${size/2} ${size*0.57})"/>
    <rect x="${size*0.35}" y="${size*0.55}" width="${size*0.3}" height="${size*0.04}" fill="#c8a84e" rx="2" transform="rotate(30 ${size/2} ${size*0.57})"/>
    <text x="${size/2}" y="${textY}" text-anchor="middle" font-size="${textSize}" font-family="serif" font-weight="bold" letter-spacing="3" fill="#c8a84e">GOAL GAME</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(`public/icons/${name}`);
  console.log(`Generated ${name} (${size}x${size})`);
}

console.log('Done!');
