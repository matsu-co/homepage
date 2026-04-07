const fs = require('fs');

// 本文の中身を取得する関数
async function getPageContent(pageId, token) {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
    });
    const data = await res.json();
    return data.results || [];
  } catch (e) { return []; }
}

async function fetchData(dbId, token, fileName, isFullDetail = false) {
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
      
      // 画像の取得（千裕さんのNotionの列名すべてに対応）
      const imgProp = p['ファイル&メディア'] || p['Image'] || p['Excerpt'];
      const images = imgProp?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      
      // 基本情報の取得（WorkでもDiaryでも使えるように）
      const title = p.Name?.title?.[0]?.plain_text || p.Title?.title?.[0]?.plain_text || '無題';
      const date = p['Date']?.date?.start || '';
      
      // 【ここが復活のポイント】
      // 列にある説明文（Work用）を優先し、なければ本文（Diary用）から取得します
      let description = p['Description']?.rich_text?.[0]?.plain_text || p['Summary']?.rich_text?.[0]?.plain_text || '';
      let blocks = [];

      if (isFullDetail) {
        blocks = await getPageContent(page.id, token);
        // 説明文が空なら、本文の1行目を拝借する（Diary用）
        if (!description) {
          description = blocks.find(b => b.type === 'paragraph')?.paragraph?.rich_text?.[0]?.plain_text || "";
        }
      }

      entries.push({
        id: page.id,
        title: title,
        date: date,
        description: description.length > 80 ? description.substring(0, 80) + '...' : description,
        category: p.Category?.select?.name || '',
        tags: p.Tags?.multi_select?.map(t => t.name) || [],
        thumbnail: images[0] || page.cover?.file?.url || '',
        contentBlocks: blocks
      });
    }

    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(fileName, JSON.stringify({ entries }));
    console.log(`--- SUCCESS: ${fileName} saved ---`);
  } catch (err) { console.error(`--- FAILED: ${fileName} ---`, err); }
}

async function main() {
  const token = process.env.NOTION_API_KEY;
  // WorkとPhotoは「プロパティ重視」、DiaryとComicは「本文まで焼き付け」と使い分けます
  await fetchData(process.env.NOTION_WORK_DB_ID, token, 'work-data.json', false);
  await fetchData(process.env.NOTION_PHOTO_DB_ID, token, 'photo-data.json', false);
  await fetchData(process.env.NOTION_DIARY_DB_ID, token, 'diary-data.json', true);
  await fetchData(process.env.NOTION_COMIC_DB_ID, token, 'comic-data.json', true);
}

main();
