const fs = require('fs');
const path = require('path');

// Create a simple favicon.ico file
// This is a minimal 16x16 pixel icon in ICO format
const createFavicon = () => {
  // ICO file header (6 bytes)
  const header = Buffer.from([
    0x00, 0x00, // Reserved, must be 0
    0x01, 0x00, // Type: 1 = ICO
    0x01, 0x00  // Number of images: 1
  ]);

  // Image directory entry (16 bytes)
  const imageEntry = Buffer.from([
    0x10, // Width: 16 pixels
    0x10, // Height: 16 pixels
    0x00, // Colors in palette (0 for >256 colors)
    0x00, // Reserved
    0x01, 0x00, // Color planes: 1
    0x20, 0x00, // Bits per pixel: 32 (RGBA)
    0x80, 0x04, 0x00, 0x00, // Size of image data: 1152 bytes
    0x16, 0x00, 0x00, 0x00  // Offset to image data: 22 bytes
  ]);

  // Create a simple 16x16 purple gradient icon
  const bitmapHeader = Buffer.from([
    0x28, 0x00, 0x00, 0x00, // Header size: 40 bytes
    0x10, 0x00, 0x00, 0x00, // Width: 16
    0x20, 0x00, 0x00, 0x00, // Height: 32 (16*2 for AND mask)
    0x01, 0x00, // Planes: 1
    0x20, 0x00, // Bits per pixel: 32
    0x00, 0x00, 0x00, 0x00, // Compression: none
    0x00, 0x04, 0x00, 0x00, // Image size: 1024 bytes
    0x00, 0x00, 0x00, 0x00, // X pixels per meter
    0x00, 0x00, 0x00, 0x00, // Y pixels per meter
    0x00, 0x00, 0x00, 0x00, // Colors used
    0x00, 0x00, 0x00, 0x00  // Important colors
  ]);

  // Create pixel data (16x16 BGRA format, bottom-up)
  const pixelData = Buffer.alloc(16 * 16 * 4); // 1024 bytes
  
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const offset = ((15 - y) * 16 + x) * 4; // Bottom-up bitmap
      
      // Create a purple gradient
      const intensity = (x + y) / 30;
      const r = Math.floor(139 * intensity + 59 * (1 - intensity)); // Purple to Blue
      const g = Math.floor(92 * intensity + 130 * (1 - intensity));
      const b = Math.floor(246 * intensity + 246 * (1 - intensity));
      
      // BGRA format
      pixelData[offset] = b;     // Blue
      pixelData[offset + 1] = g; // Green
      pixelData[offset + 2] = r; // Red
      pixelData[offset + 3] = 255; // Alpha (fully opaque)
    }
  }

  // AND mask (16x16 bits, all 0 for no transparency)
  const andMask = Buffer.alloc(16 * 16 / 8, 0x00); // 32 bytes

  // Combine all parts
  const favicon = Buffer.concat([
    header,
    imageEntry,
    bitmapHeader,
    pixelData,
    andMask
  ]);

  const faviconPath = path.join(__dirname, '../../public/favicon.ico');
  fs.writeFileSync(faviconPath, favicon);
  console.log('✅ Created favicon.ico');
};

createFavicon();