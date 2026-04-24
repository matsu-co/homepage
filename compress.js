const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const QUALITY = 85;

function findImages(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findImages(full));
    } else if (EXTS.includes(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

let files = findImages('images');
for (const entry of fs.readdirSync('.', { withFileTypes: true })) {
  if (entry.isFile() && EXTS.includes(path.extname(entry.name).toLowerCase())) {
    files.push(entry.name);
  }
}

(async () => {
  let count = 0;
  for (const file of files) {
    try {
      const original = fs.readFileSync(file);
      const ext = path.extname(file).toLowerCase();
      let pipeline = sharp(original);

      if (ext === '.jpg' || ext === '.jpeg') {
        pipeline = pipeline.jpeg({ quality: QUALITY, progressive: true });
      } else if (ext === '.png') {
        pipeline = pipeline.png({ quality: QUALITY, compressionLevel: 9 });
      } else if (ext === '.webp') {
        pipeline = pipeline.webp({ quality: QUALITY });
      }

      const compressed = await pipeline.toBuffer();

      if (compressed.length < original.length) {
        fs.writeFileSync(file, compressed);
        const saved = ((original.length - compressed.length) / 1024).toFixed(1);
        console.log('compressed: ' + file + ' (-' + saved + 'KB)');
        count++;
      } else {
        console.log('skip: ' + file + ' (already optimal)');
      }
    } catch (e) {
      console.warn('error: ' + file + ' - ' + e.message);
    }
  }
  console.log('Done. ' + count + ' files compressed.');
})();
