const fs = require('fs');
const path = require('path');

// --- 【共通】Notionの本文（blocks）を取得 ---
async function getPageContent(pageId, token) {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
    });
    const data = await res.json();
    return data.results || [];
  } catch (e) { return []; }
}

// --- 【Notion】Work, Photo, Diaryを救出する関数 ---
async function fetchNotionData(dbId, token, fileName, isFullDetail = true) {
  if (!dbId) return;
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: { property: 'Published', checkbox: { equals: true } } }),
    });
    const data = await res.json();
    if (!data.results) return;

    const entries = [];
    for (const page of data.results) {
      const p = page.properties;
      const imgProp = p['ファイル&メディア'] || p['Image'] || p['Excerpt'];
      const images = imgProp?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      const blocks = isFullDetail ? await getPageContent(page.id, token) : [];
      
      // 【救出】WorkのDescriptionとDiaryのSummaryを両方守ります
      let desc = p['Description']?.rich_text?.[0]?.plain_text || p['Summary']?.rich_text?.[0]?.plain_text || "";
      if (!desc && isFullDetail) {
        desc = blocks.find(b => b.type === 'paragraph')?.paragraph?.rich_text?.[0]?.plain_text || "";
      }

      entries.push({
        id: page.id,
        title: p.Name?.title?.[0]?.plain_text || p.Title?.title?.[0]?.plain_text || '無題',
        date: p['Date']?.date?.start || '', // Diaryの日付を救出
        description: desc,
        category: p.Category?.select?.name || '', // Workのカテゴリ（Life work）を救出
        thumbnail: images[0] || page.cover?.file?.url || '',
        images: images,
        contentBlocks: blocks
      });
    }
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(fileName, JSON.stringify({ entries }));
    console.log(`--- SUCCESS: ${fileName} ---`);
  } catch (err) { console.error(err); }
}

// --- 【Local】Comic用のMarkdownを読み込む関数 ---
function fetchLocalComics() {
  const dir = './content/comic';
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  return files.filter(f => f.endsWith('.md')).map(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const title = content.match(/title:\s*(.*)/)?.[1] || '無題';
    const date = content.match(/date:\s*(.*)/)?.[1] || '';
    const imgName = content.match(/image:\s*(.*)/)?.[1] || '';
    const body = content.split('---').pop().trim();
    return {
      id: file.replace('.md', ''),
      title: title,
      date: date,
      thumbnail: `../images/comic/${imgName}`,
      description: body.substring(0, 80) + '...',
      contentBlocks: [{ type: 'paragraph', paragraph: { rich_text: [{ plain_text: body }] } }]
    };
  });
}

async function main() {
  const token = process.env.NOTION_API_KEY;
  // 既存のNotionチームを全員復職させます
  await fetchNotionData(process.env.NOTION_WORK_DB_ID, token, 'work-data.json');
  await fetchNotionData(process.env.NOTION_PHOTO_DB_ID, token, 'photo-data.json');
  await fetchNotionData(process.env.NOTION_DIARY_DB_ID, token, 'diary-data.json');
  // Comicは新入りのHTML方式
  const comics = fetchLocalComics();
  fs.writeFileSync('comic-data.json', JSON.stringify({ entries: comics }));
  console.log(`--- FINISHED: All Sync Complete ---`);
}
main();
