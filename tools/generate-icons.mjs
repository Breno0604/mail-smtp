import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'icons');

const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#2563eb"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.55}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">R</text>
</svg>
`;

async function generateIcon(size) {
  const svg = createSVG(size);
  const filename = `icon-${size}.png`;
  const filepath = join(iconsDir, filename);
  
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(filepath);
  
  console.log(`✓ Generated ${filename}`);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  
  console.log('Generating PWA icons...\n');
  
  await generateIcon(192);
  await generateIcon(512);
  
  console.log('\n✓ All icons generated successfully!');
}

main().catch(console.error);
