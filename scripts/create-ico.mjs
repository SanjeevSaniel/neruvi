import sharp from 'sharp';
import fs from 'fs';

async function createIco() {
  // Read the SVG file
  const svgBuffer = fs.readFileSync('public/favicon.svg');

  // Convert SVG to PNG at 256x256 (ICO standard size)
  const pngBuffer = await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toBuffer();

  // Create ICO file structure
  // ICO format: ICONDIR header + ICONDIRENTRY + PNG data
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0); // Reserved (must be 0)
  iconDir.writeUInt16LE(1, 2); // Type (1 = ICO)
  iconDir.writeUInt16LE(1, 4); // Number of images

  const iconDirEntry = Buffer.alloc(16);
  iconDirEntry.writeUInt8(0, 0); // Width (0 = 256)
  iconDirEntry.writeUInt8(0, 1); // Height (0 = 256)
  iconDirEntry.writeUInt8(0, 2); // Color palette
  iconDirEntry.writeUInt8(0, 3); // Reserved
  iconDirEntry.writeUInt16LE(1, 4); // Color planes
  iconDirEntry.writeUInt16LE(32, 6); // Bits per pixel
  iconDirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
  iconDirEntry.writeUInt32LE(22, 12); // Offset to image data (6 + 16)

  // Combine all parts
  const icoBuffer = Buffer.concat([iconDir, iconDirEntry, pngBuffer]);

  // Write the ICO file
  fs.writeFileSync('public/neruvi.ico', icoBuffer);

  console.log('✓ Created public/neruvi.ico');
}

createIco().catch(console.error);
