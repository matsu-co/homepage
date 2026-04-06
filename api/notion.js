const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { type, pageId } = req.query;
  const headers = {
    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };

  try {
    if (pageId) {
      const pageRes = await fetch(`${NOTION_API}/pages/${pageId}`, { headers });
      const page = await pageRes.json();
      const blocksRes = await fetch(`${NOTION_API}/blocks/${pageId}/children?page_size=100`, { headers });
      const blocksData = await blocksRes.json();
      return res.status(200).json({ title: extractTitle(page), date: extractDate(page), blocks: blocksData.results || [] });
    }

    const dbMap = { diary: process.env.NOTION_DIARY_DB_ID, comicdiary: process.env.NOTION_COMIC_DB_ID, work: process.env.NOTION_WORK_DB_ID, photo: process.env.NOTION_PHOTO_DB_ID };
    const dbId = dbMap[type];
    if (!dbId) return res.status(400).json({ error: 'Database ID not set' });

    const sorts = (type === 'photo' || type === 'work') ? [{ timestamp: 'created_time', direction: 'descending' }] : [{ property: 'Date', direction: 'descending' }];
    const queryRes = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sorts, filter: { property: 'Published', checkbox: { equals: true } }, page_size: 50 }),
    });
    const queryData = await queryRes.json();

    const entries = (queryData.results || []).map(page => {
      const images = extractFileList(page, 'Image');
      const common = {
        id: page.id,
        title: extractTitle(page),
        date: extractDate(page),
        description: extractExcerpt(page), // HTML側と名称を統一
        images: images,
        category: extractSelect(page, 'Category'),
        tags: extractMultiSelect(page, 'Tags'),
      };

      if (type === 'work') {
        return { ...common, thumbnail: images[0] || '' };
      } else {
        return { ...common, thumbnail: images[0] || extractCover(page) };
      }
    });

    return res.status(200).json({ entries });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

/* ヘルパー関数（維持） */
function extractTitle(page) { const p = page.properties; const t = p?.Name || p?.Title || p?.title; return t?.title?.map(x => x.plain_text).join('') || ''; }
function extractDate(page) { return page.properties?.Date?.date?.start || ''; }
function extractExcerpt(page) { const p = page.properties; const e = p?.Excerpt || p?.Description || p?.テキスト; return e?.rich_text?.map(x => x.plain_text).join('') || ''; }
function extractCover(page) { return page.cover?.file?.url || page.cover?.external?.url || ''; }
function extractSelect(page, n) { return page.properties?.[n]?.select?.name || ''; }
function extractMultiSelect(page, n) { return page.properties?.[n]?.multi_select?.map(s => s.name) || []; }
function extractFileList(page, n) { const p = page.properties?.[n]; return p?.files?.map(f => f.file?.url || f.external?.url || '').filter(Boolean) || []; }
