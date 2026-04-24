const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SUBDIRS = ['images/photo', 'images/comicdiary', 'images/work', 'images/diary'];
const QUALITY = 85;

(async () => {
  let converted = 0;
  for (const dir of SUBDIRS) {
    if (!fs.existsSync(dir)) { console.log('skip:', dir); continue; }
    for (const file of fs.readdirSync(dir)) {
      const ext = path.extname(file).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
      const src = path.join(dir, file);
      const dest = path.join(dir, file.replace(/\.[^.]+$/, '.webp'));
      if (fs.existsSync(dest)) { console.log('skip (exists):', dest); continue; }
      try {
        await sharp(src).webp({ quality: QUALITY }).toFile(dest);
        const o = fs.statSync(src).size;
        const n = fs.statSync(dest).size;
        console.log(src + ' → ' + dest + ' (' + (o/1024).toFixed(0) + 'KB → ' + (n/1024).toFixed(0) + 'KB)');
        fs.unlinkSync(src);
        converted++;
      } catch (e) {
        console.warn('error:', src, e.message);
      }
    }
  }
  console.log('Done. converted=' + converted);
})();
