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
function fetchLocalComics() {
  const mdDir = './content/comicdiary'; 
  const imgDir = './images/comicdiary';

  if (!fs.existsSync(mdDir)) return [];
  const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

  // 画像フォルダの中身をあらかじめリスト化（拡張子の揺れを吸収するため）
  let imgFiles = [];
  if (fs.existsSync(imgDir)) {
    imgFiles = fs.readdirSync(imgDir);
  }

  return mdFiles.map(file => {
    const content = fs.readFileSync(path.join(mdDir, file), 'utf8');
    const title = content.match(/title\s*[:：]\s*(.*)/)?.[1]?.trim() || '無題';
    const serial = content.match(/serial\s*[:：]\s*(.*)/)?.[1]?.trim() || '';
    
    // Markdownに書かれた画像名（例：IMG_3061）を抜き出す
    const imgNameRaw = content.match(/image\s*[:：]\s*(.*)/)?.[1]?.trim() || '';
    let foundImgName = imgNameRaw;

    // フォルダ内に一致するファイル（拡張子違い含む）があるか探す
    if (imgNameRaw && imgFiles.length > 0) {
      const imgNameBase = imgNameRaw.split('.').shift().toLowerCase();
      const matchFile = imgFiles.find(f => f.split('.').shift().toLowerCase() === imgNameBase);
      if (matchFile) foundImgName = matchFile; 
    }

    const thumbnailPath = `../images/comicdiary/${foundImgName}`;
    const body = content.split('---').pop().trim();

    return {
      id: file.replace('.md', ''),
      title, 
      serial,
      thumbnail: thumbnailPath,
      images: [thumbnailPath], // 複数枚対応の準備
      description: body,
      contentBlocks: [{ type: 'paragraph', paragraph: { rich_text: [{ plain_text: body }] } }]
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
