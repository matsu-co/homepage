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
    
    // 画像の抽出（images: [a.jpg, b.jpg] または image: a.jpg 両方対応）
    const imgsMatch = header.match(/images\s*[:：]\s*\[(.*)\]/);
    let imageList = [];
    if (imgsMatch) {
      imageList = imgsMatch[1].split(',').map(i => i.trim()).filter(Boolean);
    } else {
      const singleImg = header.match(/image\s*[:：]\s*(.*)/)?.[1]?.trim();
      if (singleImg) imageList = [singleImg];
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
  await fetchNotionData(process.env.NOTION_WORK_DB_ID, token, 'work-data.json');
  await fetchNotionData(process.env.NOTION_PHOTO_DB_ID, token, 'photo-data.json');
  await fetchNotionData(process.env.NOTION_DIARY_DB_ID, token, 'diary-data.json');
  
  const comics = fetchLocalComics();
  fs.writeFileSync('comic-data.json', JSON.stringify({ entries: comics }));
}
main();
