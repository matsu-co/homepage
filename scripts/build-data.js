const fs = require('fs');
const path = require('path');

// Notion APIの設定
const NOTION_API = 'https://api.notion.com/v1';
const headers = {
  'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function fetchAndSave(type, dbId) {
  if (!dbId) {
    console.log(`Skip ${type}: Database ID is missing.`);
    return;
  }

  console.log(`Fetching ${type} from Notion...`);
  
  try {
    const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { property: 'Published', checkbox: { equals: true } },
      }),
    });
    
    const data = await res.json();
    if (!data.results) throw new Error(data.message || 'Failed to fetch');

    const entries = data.results.map(page => {
      const p = page.properties;
      // Imageプロパティから画像URLを抜き出す
      const images = p.Image?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
      
      return {
        id: page.id,
        title: p.Name?.title?.[0]?.plain_text || p.Title?.title?.[0]?.plain_text || '無題',
        description: p.Description?.rich_text?.[0]?.plain_text || '',
        category: p.Category?.select?.name || '',
        tags: p.Tags?.multi_select?.map(t => t.name) || [],
        thumbnail: images[0] || page.cover?.file?.url || page.cover?.external?.url || '',
        images: images
      };
    });

    // 保存先 (public/data) を準備
    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    // ファイルに書き出し
    fs.writeFileSync(path.join(dataDir, `${type}.json`), JSON.stringify({ entries }));
    console.log(`Successfully saved ${type}.json (${entries.length} items)`);
  } catch (err) {
    console.error(`Error fetching ${type}:`, err.message);
  }
}

async function main() {
  // Workデータベースを処理
  await fetchAndSave('work', process.env.NOTION_WORK_DB_ID);
  // 日記なども将来的に爆速にしたい場合はここに追加できます
}

main();
