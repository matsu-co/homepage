document.addEventListener("DOMContentLoaded", () => {
    // 1. 階層の判定（もっと確実にしました）
    // ファイル名が 'index.html' か、ルート直下のファイルならトップページとみなす
    const isTop = !window.location.pathname.includes('/work/') && 
                  !window.location.pathname.includes('/comicdiary/') && 
                  !window.location.pathname.includes('/diary/') && 
                  !window.location.pathname.includes('/about/') && 
                  !window.location.pathname.includes('/photo/') &&
                  !window.location.pathname.includes('/contact/');
    const pathPrefix = isTop ? "./" : "../";

    // 2. ヘッダーの処理
    const header = document.querySelector(".page-header");
    if (header) {
        // ロゴを一番前に追加（既存のタイトルは壊しません）
        if (!header.querySelector(".header-logo")) {
            const logoLink = document.createElement('a');
            logoLink.href = pathPrefix;
            logoLink.className = "logo-link";
            logoLink.style.border = "none";
            logoLink.innerHTML = `<img src="${pathPrefix}matsushimachihiro01.png" class="header-logo" style="width:180px; height:auto; display:block;">`;
            header.prepend(logoLink);
        }
    }
    // ページタイトルを手書き画像に置き換え
const pageImages = {
  '/diary/':      'diary.png',
  '/work/':       'work.png',
  '/photo/':      'photo.png',
  '/comicdiary/': 'comic.png',
  '/about/':      'about.png',
  '/contact/':    'contact.png', 
};
const h1 = header ? header.querySelector('h1') : null;
if (h1 && !isTop) {
  for (const [seg, img] of Object.entries(pageImages)) {
    if (window.location.pathname.includes(seg)) {
      h1.innerHTML = '<img src="' + pathPrefix + img + '" alt="" style="height:50px;width:auto;display:block;">';
      break;
    }
  }
}

    // 3. フッターの処理
    const footer = document.querySelector(".page-footer");
    if (footer) {
        footer.innerHTML = `<img src="${pathPrefix}matsushimachihiro02.png" class="handwritten-footer" style="width:260px; height:auto; display:block; margin:60px auto;">`;
    }
// フォント設定を全ページに適用
var fs = document.createElement('script');
fs.src = pathPrefix + 'js/font-settings.js';
document.head.appendChild(fs);

// ---- サブページ共通メニュー（star01.png） ----
  // Diary詳細（?id= がある場合）は除外
  const isDiaryDetail = window.location.pathname.includes('/diary/') &&
                        !!new URLSearchParams(window.location.search).get('id');

  if (!isTop && !isDiaryDetail) {
    const menuStyle = document.createElement('style');
    menuStyle.textContent = `
      .global-menu-btn {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 50;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        width: 88px;
        opacity: 0.9;
        transition: filter 0.3s ease, transform 0.3s ease;
      }
      .global-menu-btn:hover {
        animation: katakata-star 0.3s steps(3) infinite;
      }
      .global-menu-btn img { width: 100%; display: block; }
      .menu-nav-img {
        height: 36px;
        width: auto;
        display: block;
        margin: 0 auto;
        opacity: 0.85;
        transition: opacity 0.3s ease;
      }
      .menu-nav a:hover .menu-nav-img { opacity: 1; }
    `;
    document.head.appendChild(menuStyle);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'global-menu-btn';
    menuBtn.setAttribute('aria-label', 'メニューを開く');
    menuBtn.innerHTML = `<img src="${pathPrefix}star01.png" alt="メニュー">`;
    document.body.appendChild(menuBtn);

    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    menuOverlay.innerHTML = `
      <div class="menu-inner">
        <button class="menu-close" id="globalMenuClose">&times;</button>
        <nav class="menu-nav">
          <a href="${pathPrefix}work/"><img class="menu-nav-img" src="${pathPrefix}work.png" alt="work"></a>
          <a href="${pathPrefix}about/"><img class="menu-nav-img" src="${pathPrefix}about.png" alt="about"></a>
          <a href="${pathPrefix}comicdiary/"><img class="menu-nav-img" src="${pathPrefix}comic.png" alt="comic diary"></a>
          <a href="${pathPrefix}diary/"><img class="menu-nav-img" src="${pathPrefix}diary.png" alt="diary"></a>
          <a href="${pathPrefix}photo/"><img class="menu-nav-img" src="${pathPrefix}photo.png" alt="photo"></a>
          <a href="mailto:chihiro.matsushima.work@gmail.com"><img class="menu-nav-img" src="${pathPrefix}contact.png" alt="contact"></a>
        </nav>
      </div>
    `;
    document.body.appendChild(menuOverlay);

    menuBtn.onclick = () => {
      menuOverlay.classList.add('open');
      menuBtn.style.visibility = 'hidden';
      document.body.style.overflow = 'hidden';
    };
    const closeGlobalMenu = () => {
      menuOverlay.classList.remove('open');
      menuBtn.style.visibility = 'visible';
      document.body.style.overflow = '';
    };
    document.getElementById('globalMenuClose').onclick = closeGlobalMenu;
    menuOverlay.onclick = (e) => { if (e.target === menuOverlay) closeGlobalMenu(); };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGlobalMenu(); });
  }
    
});


