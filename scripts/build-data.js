const fs = require('fs');
const path = require('path');

// --- 【新機能】ローカルのMarkdownファイルを読み込む魔法 ---
function fetchLocalComics() {
  const dir = './content/comic';
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir);
  return files.filter(f => f.endsWith('.md')).map(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const lines = content.split('\n');
    const title = lines.find(l => l.startsWith('title:'))?.replace('title:', '').trim() || '無題';
    const date = lines.find(l => l.startsWith('date:'))?.replace('date:', '').trim() || '';
    const imgName = lines.find(l => l.startsWith('image:'))?.replace('image:', '').trim() || '';
    
    return {
      id: file.replace('.md', ''),
      title: title,
      date: date,
      thumbnail: `../images/comic/${imgName}`,
      description: content.split('---')[2]?.trim().substring(0, 80) + '...' || '',
      contentBlocks: [{ type: 'paragraph', paragraph: { rich_text: [{ plain_text: content.split('---')[2]?.trim() || '' }] } }]
    };
  });
}

// --- Notionからデータを取る既存の関数（Work, Photo, Diary用） ---
async function fetchNotionData(dbId, token, fileName) {
  if (!dbId) return;
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify({ filter: { property: 'Published', checkbox: { equals: true } } }),
  });
  const data = await res.json();
  const entries = data.results.map(page => ({
    id: page.id,
    title: page.properties.Name?.title?.[0]?.plain_text || '無題',
    description: page.properties.Description?.rich_text?.[0]?.plain_text || '',
    thumbnail: page.properties['ファイル&メディア']?.files?.[0]?.file?.url || '',
    category: page.properties.Category?.select?.name || ''
  }));
  fs.writeFileSync(fileName, JSON.stringify({ entries }));
}

async function main() {
  const token = process.env.NOTION_API_KEY;
  // Comic以外は今まで通りNotion
  await fetchNotionData(process.env.NOTION_WORK_DB_ID, token, 'work-data.json');
  await fetchNotionData(process.env.NOTION_PHOTO_DB_ID, token, 'photo-data.json');
  await fetchNotionData(process.env.NOTION_DIARY_DB_ID, token, 'diary-data.json');
  
  // Comicだけは「自分のフォルダ」から作る！
  const comics = fetchLocalComics();
  fs.writeFileSync('comic-data.json', JSON.stringify({ entries: comics }));
  console.log(`--- SUCCESS: Local Comic data saved (${comics.length} items) ---`);
}

main();
