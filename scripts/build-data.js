const fs = require('fs');

// 本文からテキストを抽出する関数
async function getPageSummary(pageId, token) {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    });
    const data = await res.json();
    // 最初の段落（paragraph）を探して、100文字程度を抜き出す
    const firstParagraph = data.results.find(b => b.type === 'paragraph')?.paragraph?.rich_text?.[0]?.plain_text || '';
    return firstParagraph.length > 80 ? firstParagraph.substring(0, 80) + '...' : firstParagraph;
  } catch (e) {
    return '';
  }
}

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
    const entries = [];

    // 各ページの中身を順番に覗きに行きます
    for (const page of data.results) {
      const p = page.properties;
      const imgProp = p['ファイル&メディア'] || p['Excerpt'] || p['Image'];
      const images = imgProp?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      
      // ここで本文の冒頭を取得！
      const autoSummary = await getPageSummary(page.id, token);

      entries.push({
        id: page.id,
        title: p.Name?.title?.[0]?.plain_text || p.Title?.title?.[0]?.plain_text || '無題',
        date: p['Date']?.date?.start || '',
        description: autoSummary, // 自動取得した冒頭文を入れる
        thumbnail: images[0] || page.cover?.file?.url || '',
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
  await fetchData(process.env.NOTION_PHOTO_ID || process.env.NOTION_PHOTO_DB_ID, token, 'photo-data.json');
  await fetchData(process.env.NOTION_DIARY_DB_ID, token, 'diary-data.json');
  await fetchData(process.env.NOTION_COMIC_DB_ID, token, 'comic-data.json');
}

main();
