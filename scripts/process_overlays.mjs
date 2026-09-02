import sharp from 'sharp';
import fs from 'fs';

async function processOverlays() {
  for (const name of ['2026', '2027']) {
    const filePath = `assets/images/${name}.png`;
    if (!fs.existsSync(filePath)) {
      console.log(`${filePath} does not exist`);
      continue;
    }
    const img = sharp(filePath);
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    
    // Create RGBA buffer
    const rgba = Buffer.alloc(info.width * info.height * 4);
    let transparentCount = 0;
    for (let i = 0; i < info.width * info.height; i++) {
      const r = data[i * info.channels];
      const g = data[i * info.channels + 1];
      const b = data[i * info.channels + 2];
      
      // Slot black color is pure black or <= 6
      const isBlackSlot = (r <= 6 && g <= 6 && b <= 6);
      
      rgba[i * 4] = r;
      rgba[i * 4 + 1] = g;
      rgba[i * 4 + 2] = b;
      if (isBlackSlot) {
        rgba[i * 4 + 3] = 0; // transparent cutout for the photo
        transparentCount++;
      } else {
        rgba[i * 4 + 3] = 255;
      }
    }
    console.log(`${name}: total ${info.width * info.height}, transparent: ${transparentCount}`);
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png()
      .toFile(`assets/images/${name}_overlay.png`);
    console.log(`Saved assets/images/${name}_overlay.png`);
  }
}

processOverlays().catch(console.error);
