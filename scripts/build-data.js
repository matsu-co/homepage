const fs = require('fs');
const path = require('path');

async function main() {
  console.log("--- START FETCHING FROM NOTION ---");
  const dbId = process.env.NOTION_WORK_DB_ID;
  const token = process.env.NOTION_API_KEY;

  if (!dbId || !token) {
    console.error("ERROR: Notion ID or API Key is missing in Vercel settings!");
    return;
  }

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
    if (!data.results) {
      throw new Error("Notion API returned an error: " + JSON.stringify(data));
    }

    const entries = data.results.map(page => {
      const p = page.properties;
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

    // 【ここが最大のポイント】
    // 複雑なフォルダ（public/data）を作らず、一番上の階層に直接「work-data.json」として保存します。
    // これならVercelが絶対に見失いません。
    fs.writeFileSync('work-data.json', JSON.stringify({ entries }));
    
    console.log(`--- SUCCESS: work-data.json saved (${entries.length} items) ---`);
  } catch (err) {
    console.error("--- FETCH FAILED ---", err);
    process.exit(1); // 失敗したことをVercelにハッキリ伝えます
  }
}

main();
