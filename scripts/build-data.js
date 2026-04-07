const fs = require('fs');

async function getPageContent(pageId, token) {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
    });
    const data = await res.json();
    return data.results || [];
  } catch (e) { return []; }
}

async function fetchData(dbId, token, fileName) {
  if (!dbId) return;
  console.log(`--- FETCHING ${fileName} ---`);

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
      
      // 画像をすべて取得（スライダーに必須）
      const imgProp = p['ファイル&メディア'] || p['Image'] || p['Excerpt'];
      const images = imgProp?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      
      const blocks = await getPageContent(page.id, token);
      let desc = p['Description']?.rich_text?.[0]?.plain_text || p['Summary']?.rich_text?.[0]?.plain_text || "";
      if (!desc) {
        desc = blocks.find(b => b.type === 'paragraph')?.paragraph?.rich_text?.[0]?.plain_text || "";
      }

      entries.push({
        id: page.id,
        title: p.Name?.title?.[0]?.plain_text || p.Title?.title?.[0]?.plain_text || '無題',
        date: p['Date']?.date?.start || '',
        description: desc,
        category: p.Category?.select?.name || '',
        tags: p.Tags?.multi_select?.map(t => t.name) || [],
        thumbnail: images[0] || page.cover?.file?.url || '',
        images: images, // スライダー用の画像配列
        contentBlocks: blocks
      });
    }

    fs.writeFileSync(fileName, JSON.stringify({ entries }));
    console.log(`--- SUCCESS: ${fileName} ---`);
  } catch (err) { console.error(err); }
}

async function main() {
  const token = process.env.NOTION_API_KEY;
  await fetchData(process.env.NOTION_WORK_DB_ID, token, 'work-data.json');
  await fetchData(process.env.NOTION_PHOTO_DB_ID, token, 'photo-data.json');
  await fetchData(process.env.NOTION_DIARY_DB_ID, token, 'diary-data.json');
  await fetchData(process.env.NOTION_COMIC_DB_ID, token, 'comic-data.json');
}
main();
