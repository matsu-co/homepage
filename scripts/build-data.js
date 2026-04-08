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

// --- 【Local】Comicを読み込む ---
// ...（上のNotion用の関数などはそのまま維持してください）...

function fetchLocalComics() {
  const dir = './content/comicdiary';
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // タイトル、連番、タグ、画像を正規表現で抜き出します
    const title = content.match(/title\s*[:：]\s*(.*)/)?.[1]?.trim() || '無題';
    const serial = content.match(/serial\s*[:：]\s*(.*)/)?.[1]?.trim() || '';
    const tagsRaw = content.match(/tags\s*[:：]\s*\[(.*)\]/)?.[1] || '';
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    
    // 画像は [img1.jpg, img2.jpg] のような配列に対応させます
    const imgsRaw = content.match(/images\s*[:：]\s*\[(.*)\]/)?.[1] || '';
    const images = imgsRaw.split(',').map(img => `../images/comicdiary/${img.trim()}`).filter(img => !img.endsWith('/'));
    
    const body = content.split('---').pop().trim();
    
    return {
      id: file.replace('.md', ''),
      title: title,
      serial: serial, // #01 などの連番
      tags: tags,     // タグの配列
      images: images, // 画像の配列（複数枚）
      thumbnail: images[0] || '', // 一覧には1枚目を出す
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
