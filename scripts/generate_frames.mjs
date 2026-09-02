import fs from 'fs';
import { Resvg } from '@resvg/resvg-js';

async function generatePngFrames() {
  const frames = [
    { svgPath: 'assets/images/frame_2026.svg', outPng1: 'assets/images/frame_2026.png', outPng2: 'assets/images/2026.png' },
    { svgPath: 'assets/images/frame_2027.svg', outPng1: 'assets/images/frame_2027.png', outPng2: 'assets/images/2027.png' }
  ];

  for (const f of frames) {
    const svg = fs.readFileSync(f.svgPath, 'utf8');
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1000
      }
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    fs.writeFileSync(f.outPng1, pngBuffer);
    fs.writeFileSync(f.outPng2, pngBuffer);
    console.log(`Generated ${f.outPng1} and ${f.outPng2} (${pngBuffer.length} bytes)`);
  }
}

generatePngFrames().catch(err => {
  console.error('Error generating PNG frames:', err);
});
