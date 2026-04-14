const fs = require('fs');
const path = require('path');

// --- 【共通】本文を取得する ---
async function getPageContent(pageId, token) {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
    });
    const data = await res.json();
    return data.results || [];
  } catch (e) { return []; }
}

// --- 【Notion】Work, Photo, Diaryを救出 ---
async function fetchNotionData(dbId, token, fileName) {
  if (!dbId) return;
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: { property: 'Published', checkbox: { equals: true } } }),
    });
    const data = await res.json();
    const entries = [];
    for (const page of data.results) {
      const p = page.properties;
      const imgProp = p['ファイル&メディア'] || p['Image'] || p['Excerpt'];
      const images = imgProp?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      const blocks = await getPageContent(page.id, token);
      
      // 【修正】WorkのDescriptionとDiaryの日付、どちらも確実に拾えるように
      let desc = p['Description']?.rich_text?.[0]?.plain_text || p['Summary']?.rich_text?.[0]?.plain_text || "";
      if (!desc) {
        desc = blocks.find(b => b.type === 'paragraph')?.paragraph?.rich_text?.[0]?.plain_text || "";
      }

      entries.push({
        id: page.id,
        title: p.Name?.title?.[0]?.plain_text || p.Title?.title?.[0]?.plain_text || '無題',
        date: p.Date?.date?.start || p['日付']?.date?.start || '', // ★日付の揺れに対応
        description: desc,
        category: p.Category?.select?.name || '',
        thumbnail: images[0] || page.cover?.file?.url || '',
        images: images,
        contentBlocks: blocks
      });
    }
    fs.writeFileSync(fileName, JSON.stringify({ entries }));
  } catch (err) { console.error(err); }
}

// --- 【Local】ComicをGitHubのフォルダから読み込む（最強強化版） ---
// --- 【Local】ComicをGitHubのフォルダから読み込む（最強強化版） ---
function fetchLocalComics() {
  const mdDir = './content/comicdiary'; 
  const imgDir = './images/comicdiary';

  if (!fs.existsSync(mdDir)) return [];
  const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

  let imgFiles = [];
  if (fs.existsSync(imgDir)) {
    imgFiles = fs.readdirSync(imgDir);
  }

  return mdFiles.map(file => {
    const content = fs.readFileSync(path.join(mdDir, file), 'utf8');
    // Frontmatter(---で囲まれた部分)だけを正確に切り出す
    const parts = content.split('---');
    const header = parts[1] || '';
    const body = parts.slice(2).join('---').trim();

    const title = header.match(/title\s*[:：]\s*(.*)/)?.[1]?.trim() || '無題';
    const serial = header.match(/serial\s*[:：]\s*(.*)/)?.[1]?.trim() || '';
    
    // タグの抽出（無い場合は空配列にする）
    const tagsMatch = header.match(/tags\s*[:：]\s*\[(.*)\]/);
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [];
    
    // 画像の取得：frontmatterに書いていれば優先、なければ日付名で自動検出
const imgsMatch = header.match(/images\s*[:：]\s*\[(.*)\]/);
const singleImg = header.match(/image\s*[:：]\s*(.*)/)?.[1]?.trim();
let imageList = [];
if (imgsMatch) {
  // frontmatterに images: [...] が書いてある場合はそちらを使う
  imageList = imgsMatch[1].split(',').map(i => i.trim()).filter(Boolean);
} else if (singleImg) {
  // frontmatterに image: xxx が書いてある場合
  imageList = [singleImg];
} else {
  // 何も書いていない → mdのファイル名（日付）で始まる画像を自動検出
  const datePrefix = file.replace('.md', ''); // 例: "2026-04-20"
  imageList = imgFiles
    .filter(f => f.startsWith(datePrefix))
    .sort(); // 2026-04-20-01.jpg, 2026-04-20-02.jpg の順に並ぶ
}

// 実際のファイル名と照合してパスを作る
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
      description: body
    };
  });
}
// ...（main関数の中身も以前のままでOKです）...

async function main() {
  const token = process.env.NOTION_API_KEY;
  // Work → ローカルファイルから読み込む
  const works = fetchLocalWork();
  fs.writeFileSync('work-data.json', JSON.stringify({ entries: works }));
  
  const photos = fetchLocalPhoto();
fs.writeFileSync('photo-data.json', JSON.stringify({ entries: photos }, null, 2));
  
  const diaryEntries = await fetchLocalDiary();
fs.writeFileSync('./diary-data.json', JSON.stringify({ entries: diaryEntries }, null, 2));

// --- 【Local】Workをローカルファイルから読み込む ---
function fetchLocalWork() {
  const mdDir = './content/work';
  const imgDir = './images/work';

  if (!fs.existsSync(mdDir)) return [];
  const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

  let imgFiles = [];
  if (fs.existsSync(imgDir)) {
    imgFiles = fs.readdirSync(imgDir);
  }

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

    // 画像：frontmatterに書いてあれば優先、なければファイル名で自動検出
    const imgsMatch = header.match(/images\s*[:：]\s*\[(.*)\]/);
    const singleImg = header.match(/image\s*[:：]\s*(.*)/)?.[1]?.trim();
    let imageList = [];
    if (imgsMatch) {
      imageList = imgsMatch[1].split(',').map(i => i.trim()).filter(Boolean);
    } else if (singleImg) {
      imageList = [singleImg];
    } else {
      // mdファイル名で始まる画像を自動検出・連番順に並べる
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
      .filter(f => f.startsWith(prefix + '-'))
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

  async function fetchLocalDiary() {
  const contentDir = './content/diary';
  const imageDir = './images/diary';
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

// 画像：prefix + '-' で始まるものだけ対象にし、数字順でソート
const images = imgFiles
  .filter(f => f.startsWith(prefix + '-'))
  .sort((a, b) => {
    const na = parseInt(a.match(/-(\d+)\.\w+$/)?.[1] || 0);
    const nb = parseInt(b.match(/-(\d+)\.\w+$/)?.[1] || 0);
    return na - nb;
  })
  .map(f => `../images/diary/${f}`);

// markdown→シンプルHTML変換
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

// 本文から自動でexcerptを生成（画像ファイル名・空行は除く）
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
  
  const comics = fetchLocalComics();
  fs.writeFileSync('comic-data.json', JSON.stringify({ entries: comics }));
}
main();
