/* ============================
   matsushima CHIHIRO. - Main JS
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log("--- 1. プログラムを開始しました ---");

  let editMode = false;
  let editTarget = 'label'; 
  let hoveredElement = null;
  let editDrag = null;

  /* --- フルスクリーンメニュー --- */
  const menuToggle = document.getElementById('menuToggle');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuClose = document.getElementById('menuClose');

  if (menuToggle && menuOverlay) {
    menuToggle.onclick = () => {
      menuOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
      menuOverlay.classList.remove('open');
      document.body.style.overflow = '';
    };
    if (menuClose) menuClose.onclick = closeMenu;
    menuOverlay.onclick = (e) => { if (e.target === menuOverlay) closeMenu(); };
  }

  /* --- メモ：ランダムメッセージ --- */
  const messages = ['今日もいい日になりますように','コーヒーでも飲もう','絵を描く時間がすき','散歩に行きたいな','ありがとう','おつかれさま','窓の外を見てごらん','すこし休もう','きょうは何を描こうかな','風がきもちいい'];
  const memo = document.getElementById('memo');
  const tooltip = document.getElementById('memoTooltip');
  if (memo && tooltip) {
    memo.onmouseenter = () => {
      tooltip.textContent = messages[Math.floor(Math.random() * messages.length)];
      tooltip.classList.add('visible');
    };
    memo.onmouseleave = () => { tooltip.classList.remove('visible'); };
  }

  /* --- 編集用バナー --- */
  const editBanner = document.createElement('div');
  editBanner.id = 'editBanner';
  editBanner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(26,26,26,0.95);color:#eee;text-align:center;padding:10px;font-size:12px;z-index:9999;display:none;backdrop-filter:blur(4px);';
  editBanner.innerHTML = `編集モード ｜ 
    <button id="editModeLabel" style="background:#a08a6e;color:#fff;border:none;padding:4px 10px;cursor:pointer;">ラベル移動</button>
    <button id="editModeObj" style="background:#555;color:#eee;border:none;padding:4px 10px;cursor:pointer;">オブジェクト移動</button> ｜ 
    <button id="editExport" style="background:#a08a6e;color:#fff;border:none;padding:4px 10px;cursor:pointer;">CSS書き出し</button>`;
  document.body.appendChild(editBanner);

  /* --- 編集機能のコア --- */
  function setEditTarget(target) {
    editTarget = target;
    document.getElementById('editModeLabel').style.background = target === 'label' ? '#a08a6e' : '#555';
    document.getElementById('editModeObj').style.background = target === 'object' ? '#a08a6e' : '#555';

    document.querySelectorAll('.element').forEach(el => {
      if (target === 'object') {
        el.style.cursor = 'move';
        el.style.outline = '1px dashed rgba(160,138,110,0.5)';
        
        // 【修正】マウスが乗った時にサイズ変更ができるようにする
        el.onmouseenter = () => {
          if (editMode && editTarget === 'object') {
            hoveredElement = el;
            el.style.outline = '2px solid #ff4444'; // 赤く光らせる
            console.log("ターゲット捕捉:", el.classList[0]);
          }
        };
        el.onmouseleave = () => {
          hoveredElement = null;
          el.style.outline = '1px dashed rgba(160,138,110,0.5)';
        };
        
        // 【重要】ホイールでサイズ変更
        el.onwheel = (e) => {
          if (!editMode || editTarget !== 'object') return;
          e.preventDefault();
          const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
          let currentWidth = (el.offsetWidth / canvasRect.width) * 100;
          // ホイール感度を調整（deltaYが±であれば1%ずつ増減）
          let newWidth = currentWidth + (e.deltaY < 0 ? 1.0 : -1.0);
          if (newWidth > 1 && newWidth < 100) {
            el.style.width = newWidth.toFixed(1) + '%';
            console.log("サイズ変更:", el.style.width);
          }
        };

      } else {
        el.style.cursor = '';
        el.style.outline = '';
        el.onmouseenter = null;
        el.onmouseleave = null;
        el.onwheel = null;
      }
    });

    document.querySelectorAll('.obj-label').forEach(label => {
      label.style.opacity = target === 'label' ? '1' : '0.3';
      label.style.pointerEvents = target === 'label' ? 'auto' : 'none';
    });
  }

  /* --- 編集モード切替 --- */
  window.onkeydown = (e) => {
    if (e.key.toLowerCase() === 'e') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      editMode = !editMode;
      editBanner.style.display = editMode ? 'block' : 'none';
      if (editMode) setEditTarget('label');
    }
  };

  /* --- ドラッグ移動 --- */
  document.onmousedown = (e) => {
    if (!editMode) return;
    const el = e.target.closest(editTarget === 'label' ? '.obj-label' : '.element');
    if (!el) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const cRect = document.querySelector('.canvas').getBoundingClientRect();
    editDrag = { el, startX: e.clientX, startY: e.clientY, startTop: ((rect.top - cRect.top)/cRect.height)*100, startLeft: ((rect.left - cRect.left)/cRect.width)*100 };
  };
  document.onmousemove = (e) => {
    if (!editDrag) return;
    const cRect = document.querySelector('.canvas').getBoundingClientRect();
    editDrag.el.style.top = (editDrag.startTop + ((e.clientY - editDrag.startY)/cRect.height)*100) + '%';
    editDrag.el.style.left = (editDrag.startLeft + ((e.clientX - editDrag.startX)/cRect.width)*100) + '%';
  };
  document.onmouseup = () => { editDrag = null; };

  /* --- CSS書き出し --- */
  document.onclick = (e) => {
    if (e.target.id === 'editModeLabel') setEditTarget('label');
    if (e.target.id === 'editModeObj') setEditTarget('object');
    if (e.target.id === 'editExport') {
      let css = '/* --- オブジェクト位置とサイズ --- */\n';
      document.querySelectorAll('.element').forEach(el => {
        const cls = [...el.classList].find(c => !['element','hoverable'].includes(c));
        if (cls) {
          const r = el.getBoundingClientRect();
          const c = document.querySelector('.canvas').getBoundingClientRect();
          css += `.${cls} { top: ${((r.top-c.top)/c.height*100).toFixed(1)}%; left: ${((r.left-c.left)/c.width*100).toFixed(1)}%; width: ${(r.width/c.width*100).toFixed(1)}%; transform: none !important; }\n`;
        }
      });
      console.log(css);
      alert("コンソールにCSSを出力しました。");
    }
  };

  /* --- 読み込みアニメーション（シンプル・安定版） --- */
  document.querySelectorAll('.element').forEach((el, i) => {
    // 最初は透明にして少し下に下げておく
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';

    setTimeout(() => {
      // 0.6秒かけてスッと現れる
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease, filter 0.4s ease'; 
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)'; // 定位置へ
    }, 100 + i * 80);
  });
}); // ← 最後の閉じカッコ

/* ============================
   Notion ヘルパー（グローバル）
   ============================ */
const NotionHelper = (() => {
  const API_BASE = '/api/notion';

  async function getEntries(type) {
    try {
      const res = await fetch(`${API_BASE}?type=${type}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.entries || [];
    } catch (e) {
      console.warn('NotionHelper.getEntries error:', e);
      return [];
    }
  }

  async function getEntry(pageId) {
    try {
      const res = await fetch(`${API_BASE}?pageId=${pageId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('NotionHelper.getEntry error:', e);
      return null;
    }
  }

  function richTextToHtml(richTextArr) {
    if (!richTextArr || !richTextArr.length) return '';
    return richTextArr.map(t => {
      let text = escapeHtml(t.plain_text);
      if (t.annotations?.bold) text = `<strong>${text}</strong>`;
      if (t.annotations?.italic) text = `<em>${text}</em>`;
      if (t.annotations?.strikethrough) text = `<s>${text}</s>`;
      if (t.annotations?.underline) text = `<u>${text}</u>`;
      if (t.annotations?.code) text = `<code>${text}</code>`;
      if (t.href) text = `<a href="${escapeHtml(t.href)}" target="_blank" rel="noopener">${text}</a>`;
      return text;
    }).join('');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function blocksToHtml(blocks) {
    if (!blocks || !blocks.length) return '';
    return blocks.map(block => {
      const type = block.type;
      switch (type) {
        case 'paragraph':
          return `<p>${richTextToHtml(block.paragraph?.rich_text)}</p>`;
        case 'heading_1':
          return `<h1>${richTextToHtml(block.heading_1?.rich_text)}</h1>`;
        case 'heading_2':
          return `<h2>${richTextToHtml(block.heading_2?.rich_text)}</h2>`;
        case 'heading_3':
          return `<h3>${richTextToHtml(block.heading_3?.rich_text)}</h3>`;
        case 'bulleted_list_item':
          return `<li>${richTextToHtml(block.bulleted_list_item?.rich_text)}</li>`;
        case 'numbered_list_item':
          return `<li>${richTextToHtml(block.numbered_list_item?.rich_text)}</li>`;
        case 'quote':
          return `<blockquote>${richTextToHtml(block.quote?.rich_text)}</blockquote>`;
        case 'divider':
          return '<hr>';
        case 'image': {
          const url = block.image?.file?.url || block.image?.external?.url || '';
          const caption = block.image?.caption?.length
            ? richTextToHtml(block.image.caption)
            : '';
          return url
            ? `<figure><img src="${escapeHtml(url)}" alt="" loading="lazy">${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`
            : '';
        }
        case 'callout':
          return `<div class="callout">${block.callout?.icon?.emoji || ''} ${richTextToHtml(block.callout?.rich_text)}</div>`;
        case 'bookmark':
          return block.bookmark?.url
            ? `<p><a href="${escapeHtml(block.bookmark.url)}" target="_blank" rel="noopener">${escapeHtml(block.bookmark.url)}</a></p>`
            : '';
        default:
          return '';
      }
    }).join('\n');
  }

  return { getEntries, getEntry, blocksToHtml, richTextToHtml };
})();