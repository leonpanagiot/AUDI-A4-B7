import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, text) {
  // Create an uncompressed RGBA buffer
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = width / 2;

      // Dark carbon background with red gradient edge
      if (dist < maxR - 8) {
        // Outer ring accent
        if (dist > maxR - 22) {
          rawData[pxOffset] = 220;     // Red rim
          rawData[pxOffset + 1] = 20;
          rawData[pxOffset + 2] = 40;
          rawData[pxOffset + 3] = 255;
        } else {
          // Center gradient
          const factor = Math.max(0, 1 - dist / (maxR * 0.7));
          rawData[pxOffset] = Math.min(255, Math.floor(18 + factor * 40));
          rawData[pxOffset + 1] = Math.min(255, Math.floor(22 + factor * 25));
          rawData[pxOffset + 2] = Math.min(255, Math.floor(30 + factor * 40));
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent outside circle
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  function crc32(buf) {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per sample
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Non-interlaced

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });

// 192x192
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, 220, 20, 40));
// 512x512
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, 220, 20, 40));
// maskable 512x512 (with padding safe zone)
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 200, 15, 35));
// apple touch icon (180x180)
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, 220, 20, 40));

console.log('Generated PNG icons successfully.');
