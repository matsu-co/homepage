const fs = require('fs');

// 【重要】ページの中身（文章や写真のデータ）をすべて取得する関数
async function getPageContent(pageId, token) {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    });
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
}

async function fetchData(dbId, token, fileName) {
  if (!dbId) return;
  console.log(`--- FETCHING ${fileName} (Full Detail Mode) ---`);

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
    const entries = [];

    // 各ページの中身を順番に「焼き付け」に行きます
    for (const page of data.results) {
      const p = page.properties;
      const imgProp = p['ファイル&メディア'] || p['Image'] || p['Excerpt'];
      const images = imgProp?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      
      // 本文の中身（ブロック）を丸ごと取得
      const blocks = await getPageContent(page.id, token);
      
      // 最初の段落をサマリー（冒頭文）にする
      const firstP = blocks.find(b => b.type === 'paragraph')?.paragraph?.rich_text?.[0]?.plain_text || "";

      entries.push({
        id: page.id,
        title: p.Name?.title?.[0]?.plain_text || p.Title?.title?.[0]?.plain_text || '無題',
        date: p['Date']?.date?.start || '',
        description: firstP.length > 70 ? firstP.substring(0, 70) + '...' : firstP,
        thumbnail: images[0] || page.cover?.file?.url || '',
        contentBlocks: blocks // ★ここが重要！詳細ページ用の中身です
      });
    }

    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(fileName, JSON.stringify({ entries }));
    console.log(`--- SUCCESS: ${fileName} saved ---`);
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
