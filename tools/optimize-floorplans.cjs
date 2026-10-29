// Usage: NODE_PATH=<directory containing sharp> node tools/optimize-floorplans.cjs <approved PNG>
// Coordinates preserve the complete plans and their original labels; no artwork is redrawn.
const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs/promises');
const source = process.argv[2];
const output = path.resolve(__dirname, '../assets/photos');
async function main() {
  if (!source) throw new Error('Provide the approved 1619 × 972 PNG path.');
  const metadata = await sharp(source).metadata();
  if (metadata.width !== 1619 || metadata.height !== 972) throw new Error('Unexpected source dimensions; review crop coordinates first.');
  const images = [{ name: 'layout' }, { name: 'seated', top: 90, height: 410 }, { name: 'standing', top: 505, height: 440 }];
  const results = [];
  for (const image of images) {
    for (const width of image.top === undefined ? [1619] : [1619, 960]) {
      const file = `melusine-private-hire-${image.name}${width === 960 ? '-960' : ''}.webp`;
      let pipeline = sharp(source);
      if (image.top !== undefined) pipeline = pipeline.extract({ left: 0, top: image.top, width: 1619, height: image.height });
      const info = await pipeline.resize({ width, withoutEnlargement: true }).webp({ quality: 90, effort: 6, smartSubsample: true }).toFile(path.join(output, file));
      results.push({ file, width: info.width, height: info.height, bytes: (await fs.stat(path.join(output, file))).size });
    }
  }
  console.log(JSON.stringify(results, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
