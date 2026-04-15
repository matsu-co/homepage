const fs = require('fs');
const path = require('path');

// --- 【Local】Work ---
function fetchLocalWork() {
  const mdDir = './content/work';
  const imgDir = './images/work';
  if (!fs.existsSync(mdDir)) return [];
  const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));
  let imgFiles = [];
  if (fs.existsSync(imgDir)) imgFiles = fs.readdirSync(imgDir);

  return mdFiles.map(file => {
    const content = fs.readFileSync(path.join(mdDir, file), 'utf8');
    const parts = content.split('---');
    const header = parts[1] || '';
    const body = parts.slice(2).join('---').trim();
    const title = header.match(/title\s*[:：]\s*(.*)/)?.[1]?.trim() || '無題';
    const category = header.match(/category\s*[:：]\s*(.*)/)?.[1]?.trim() || 'work';
    const tagsMatch = header.match(/tags\s*[:：]\s*\[(.*)\]/);
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [];
    const description = header.match(/description\s*[:：]\s*(.*)/)?.[1]?.trim() || body;

    const imgsMatch = header.match(/images\s*[:：]\s*\[(.*)\]/);
    const singleImg = header.match(/^image\s*[:：]\s*(.+)/m)?.[1]?.trim();
    let imageList = [];
    if (imgsMatch) {
      imageList = imgsMatch[1].split(',').map(i => i.trim()).filter(Boolean);
    } else if (singleImg) {
      imageList = [singleImg];
    } else {
      const prefix = file.replace('.md', '');
      imageList = imgFiles.filter(f => f.startsWith(prefix)).sort();
    }

    const fullPaths = imageList.map(img => {
      const base = img.split('.').shift().toLowerCase();
      const match = imgFiles.find(f => f.split('.').shift().toLowerCase() === base);
      return `../images/work/${match || img}`;
    });

    return {
      id: file.replace('.md', ''),
      title, category, tags, description,
      thumbnail: fullPaths[0] || '',
      images: fullPaths,
    };
  });
}

// --- 【Local】Photo ---
function fetchLocalPhoto() {
  const mdDir = './content/photo';
  const imgDir = './images/photo';
  if (!fs.existsSync(mdDir)) return [];
  const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));
  let imgFiles = [];
  if (fs.existsSync(imgDir)) imgFiles = fs.readdirSync(imgDir);

  return mdFiles.map(file => {
    const content = fs.readFileSync(path.join(mdDir, file), 'utf8');
    const parts = content.split('---');
    const header = parts[1] || '';
    const title = header.match(/title\s*[:：]\s*(.*)/)?.[1]?.trim() || '';
    const description = header.match(/description\s*[:：]\s*(.*)/)?.[1]?.trim() || '';
    const prefix = file.replace('.md', '');

    const images = imgFiles
      .filter(f => f.startsWith(prefix + '-') || (f.startsWith(prefix + '.') && /\.(jpg|jpeg|png|gif|webp)$/i.test(f)))
      .sort((a, b) => {
        const na = parseInt(a.match(/-(\d+)\.\w+$/)?.[1] || 0);
        const nb = parseInt(b.match(/-(\d+)\.\w+$/)?.[1] || 0);
        return na - nb;
      })
      .map(f => `../images/photo/${f}`);

    return {
      id: prefix,
      title,
      description,
      thumbnail: images[0] || '',
      images,
    };
  });
}

// --- 【Local】Comic ---
function fetchLocalComics() {
  const mdDir = './content/comicdiary';
  const imgDir = './images/comicdiary';
  if (!fs.existsSync(mdDir)) return [];
  const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));
  let imgFiles = [];
  if (fs.existsSync(imgDir)) imgFiles = fs.readdirSync(imgDir);

  return mdFiles.map(file => {
    const content = fs.readFileSync(path.join(mdDir, file), 'utf8');
    const parts = content.split('---');
    const header = parts[1] || '';
    const body = parts.slice(2).join('---').trim();
    const title = header.match(/title\s*[:：]\s*(.*)/)?.[1]?.trim() || '無題';
    const serial = header.match(/serial\s*[:：]\s*(.*)/)?.[1]?.trim() || '';
    const tagsMatch = header.match(/tags\s*[:：]\s*\[(.*)\]/);
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [];

    const imgsMatch = header.match(/images\s*[:：]\s*\[(.*)\]/);
    const singleImg = header.match(/^image\s*[:：]\s*(.+)/m)?.[1]?.trim();
    let imageList = [];
    if (imgsMatch) {
      imageList = imgsMatch[1].split(',').map(i => i.trim()).filter(Boolean);
    } else if (singleImg) {
      imageList = [singleImg];
    } else {
      const datePrefix = file.replace('.md', '');
      imageList = imgFiles
        .filter(f => f.startsWith(datePrefix + '-') || (f.startsWith(datePrefix + '.') && /\.(jpg|jpeg|png|gif|webp)$/i.test(f)))
        .sort();
    }

    const fullPaths = imageList.map(img => {
      const base = img.split('.').shift().toLowerCase();
      const match = imgFiles.find(f => f.split('.').shift().toLowerCase() === base);
      return `../images/comicdiary/${match || img}`;
    });

    return {
      id: file.replace('.md', ''),
      title, serial, tags,
      images: fullPaths,
      thumbnail: fullPaths[0] || '',
      description: body,
    };
  });
}

// --- 【Local】Diary ---
function fetchLocalDiary() {
  const contentDir = './content/diary';
  const imageDir = './images/diary';
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md')).sort().reverse();
  const imgFiles = fs.existsSync(imageDir) ? fs.readdirSync(imageDir) : [];

  return files.map(file => {
    const raw = fs.readFileSync(path.join(contentDir, file), 'utf8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    const fm = {};
    if (fmMatch) {
      fmMatch[1].split('\n').forEach(line => {
        const [k, ...v] = line.split(':');
        if (k) fm[k.trim()] = v.join(':').trim();
      });
    }
    const prefix = file.replace('.md', '');

    const images = imgFiles
      .filter(f => f.startsWith(prefix + '-') || (f.startsWith(prefix + '.') && /\.(jpg|jpeg|png|gif|webp)$/i.test(f)))
      .sort((a, b) => {
        const na = parseInt(a.match(/-(\d+)\.\w+$/)?.[1] || 0);
        const nb = parseInt(b.match(/-(\d+)\.\w+$/)?.[1] || 0);
        return na - nb;
      })
      .map(f => `../images/diary/${f}`);

    const htmlContent = body
      .split('\n\n')
      .map(p => {
        p = p.replace(/^([\w\-]+\.(jpg|jpeg|png|gif|webp))$/gm,
          (_, fn) => `<img src="../images/diary/${fn}" style="max-width:100%;border-radius:6px;margin:12px 0;">`
        );
        p = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (p.trim().startsWith('<img')) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');

    const imageLineRe = /^[\w\-]+\.(jpg|jpeg|png|gif|webp)$/i;
    const textLines = body.split('\n').filter(l => l.trim() && !imageLineRe.test(l.trim()));
    const rawExcerpt = textLines.slice(0, 2).join(' ').replace(/\*\*(.*?)\*\*/g, '$1');
    const description = rawExcerpt.length > 80
      ? rawExcerpt.slice(0, 80) + '…'
      : (rawExcerpt ? rawExcerpt + '…' : '');

    return {
      id: prefix,
      title: fm.title || prefix,
      date: fm.date || prefix,
      description,
      excerpt: description,
      cover: images[0] || '',
      thumbnail: images[0] || '',
      images,
      htmlContent,
    };
  });
}

// --- メイン ---
async function main() {
  const works = fetchLocalWork();
  fs.writeFileSync('work-data.json', JSON.stringify({ entries: works }, null, 2));

  const photos = fetchLocalPhoto();
  fs.writeFileSync('photo-data.json', JSON.stringify({ entries: photos }, null, 2));

  const diaryEntries = fetchLocalDiary();
  fs.writeFileSync('diary-data.json', JSON.stringify({ entries: diaryEntries }, null, 2));

  const comics = fetchLocalComics();
  fs.writeFileSync('comic-data.json', JSON.stringify({ entries: comics }, null, 2));
}

main();
