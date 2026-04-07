const fs = require('fs');

async function fetchData(dbId, token, fileName) {
  if (!dbId) return;
  console.log(`--- FETCHING ${fileName} ---`);

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'Published', checkbox: { equals: true } },
      }),
    });

    const data = await res.json();
    if (!data.results) throw new Error(JSON.stringify(data));

    const entries = data.results.map(page => {
      const p = page.properties;
      
      // 【ここを修正】
      // Notionの列名「ファイル&メディア」または「Image」から画像を探します
      const imageProperty = p['ファイル&メディア'] || p['Image'];
      const images = imageProperty?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      
      return {
        id: page.id,
        title: p.Name?.title?.[0]?.plain_text || p.Title?.title?.[0]?.plain_text || '無題',
        description: p.Excerpt?.rich_text?.[0]?.plain_text || p.Description?.rich_text?.[0]?.plain_text || '',
        category: p.Category?.select?.name || '',
        tags: p.Tags?.multi_select?.map(t => t.name) || [],
        thumbnail: images[0] || page.cover?.file?.url || page.cover?.external?.url || '',
        images: images
      };
    });

    fs.writeFileSync(fileName, JSON.stringify({ entries }));
    console.log(`--- SUCCESS: ${fileName} saved (${entries.length} items) ---`);
  } catch (err) {
    console.error(`--- FAILED: ${fileName} ---`, err);
  }
}

async function main() {
  const token = process.env.NOTION_API_KEY;
  await fetchData(process.env.NOTION_WORK_DB_ID, token, 'work-data.json');
  await fetchData(process.env.NOTION_PHOTO_DB_ID, token, 'photo-data.json');
  await fetchData(process.env.NOTION_DIARY_DB_ID, token, 'diary-data.json');
  await fetchData(process.env.NOTION_COMIC_DB_ID, token, 'comic-data.json');
}

main();
