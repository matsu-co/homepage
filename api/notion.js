/**
 * Notion API サーバーレス関数（Vercel用）
 *
 * 環境変数:
 *   NOTION_API_KEY        - Notion インテグレーションのシークレットキー
 *   NOTION_DIARY_DB_ID    - 文章日記のデータベースID
 *   NOTION_COMIC_DB_ID    - イラスト日記のデータベースID
 *   NOTION_WORK_DB_ID     - 作品集のデータベースID
 *   NOTION_PHOTO_DB_ID    - 写真アーカイブのデータベースID
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { type, pageId } = req.query;

  const headers = {
    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };

  try {
    // --- 記事詳細の取得 ---
    if (pageId) {
      const pageRes = await fetch(`${NOTION_API}/pages/${pageId}`, { headers });
      const page = await pageRes.json();

      const blocksRes = await fetch(`${NOTION_API}/blocks/${pageId}/children?page_size=100`, { headers });
      const blocksData = await blocksRes.json();

      const title = extractTitle(page);
      const date = extractDate(page);

      return res.status(200).json({
        title,
        date,
        blocks: blocksData.results || [],
      });
    }

    // --- 一覧の取得 ---
    const dbMap = {
      diary: process.env.NOTION_DIARY_DB_ID,
      comicdiary: process.env.NOTION_COMIC_DB_ID,
      work: process.env.NOTION_WORK_DB_ID,
      photo: process.env.NOTION_PHOTO_DB_ID,
    };

    const dbId = dbMap[type];

    if (!dbId) {
      return res.status(400).json({ error: 'データベースIDが設定されていません (type=' + type + ')' });
    }

    // ソート設定（photoは日付なし→作成日ソートも可）
    const sorts = (type === 'photo')
      ? [{ timestamp: 'created_time', direction: 'descending' }]
      : [{ property: 'Date', direction: 'descending' }];

    // フィルタ（Publishedチェックボックスがあればフィルタ）
    const filter = {
      property: 'Published',
      checkbox: { equals: true },
    };

    const queryRes = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sorts,
        filter,
        page_size: 50,
      }),
    });

    const queryData = await queryRes.json();

    // type別のエントリ整形
    let entries;

    if (type === 'work') {
      entries = (queryData.results || []).map(page => ({
        id: page.id,
        title: extractTitle(page),
        date: extractDate(page),
        excerpt: extractExcerpt(page),
        cover: extractCover(page),
        category: extractSelect(page, 'Category'),
        url: extractUrl(page, 'URL'),
        tags: extractMultiSelect(page, 'Tags'),
      }));
    } else if (type === 'photo') {
      entries = (queryData.results || []).map(page => ({
        id: page.id,
        title: extractTitle(page),
        image: extractCover(page) || extractFileProperty(page, 'Image'),
        caption: extractExcerpt(page),
      }));
    } else {
      // diary / comicdiary
      entries = (queryData.results || []).map(page => ({
        id: page.id,
        title: extractTitle(page),
        date: extractDate(page),
        excerpt: extractExcerpt(page),
        cover: extractCover(page),
      }));
    }

    return res.status(200).json({ entries });

  } catch (error) {
    console.error('Notion API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/* --- ヘルパー関数 --- */

function extractTitle(page) {
  const titleProp = page.properties?.Name || page.properties?.Title || page.properties?.title;
  if (!titleProp) return '';
  const titleArr = titleProp.title || [];
  return titleArr.map(t => t.plain_text).join('');
}

function extractDate(page) {
  const dateProp = page.properties?.Date;
  if (!dateProp?.date?.start) return '';
  return dateProp.date.start;
}

function extractExcerpt(page) {
  const excerptProp = page.properties?.Excerpt || page.properties?.Description;
  if (!excerptProp?.rich_text) return '';
  return excerptProp.rich_text.map(t => t.plain_text).join('').slice(0, 120);
}

function extractCover(page) {
  if (page.cover?.file?.url) return page.cover.file.url;
  if (page.cover?.external?.url) return page.cover.external.url;
  return '';
}

function extractSelect(page, propName) {
  const prop = page.properties?.[propName];
  if (!prop?.select?.name) return '';
  return prop.select.name;
}

function extractMultiSelect(page, propName) {
  const prop = page.properties?.[propName];
  if (!prop?.multi_select) return [];
  return prop.multi_select.map(s => s.name);
}

function extractUrl(page, propName) {
  const prop = page.properties?.[propName];
  if (!prop?.url) return '';
  return prop.url;
}

function extractFileProperty(page, propName) {
  const prop = page.properties?.[propName];
  if (!prop?.files?.length) return '';
  const file = prop.files[0];
  if (file.file?.url) return file.file.url;
  if (file.external?.url) return file.external.url;
  return '';
}
