document.addEventListener("DOMContentLoaded", () => {
    // 1. 階層の判定（もっと確実にしました）
    // ファイル名が 'index.html' か、ルート直下のファイルならトップページとみなす
    const isTop = !window.location.pathname.includes('/work/') && 
                  !window.location.pathname.includes('/comicdiary/') && 
                  !window.location.pathname.includes('/diary/') && 
                  !window.location.pathname.includes('/about/') && 
                  !window.location.pathname.includes('/photo/');
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

    // 3. フッターの処理
    const footer = document.querySelector(".page-footer");
    if (footer) {
        footer.innerHTML = `<img src="${pathPrefix}matsushimachihiro02.png" class="handwritten-footer" style="width:260px; height:auto; display:block; margin:60px auto;">`;
    }
});
// フォント設定を全ページに適用
var fs = document.createElement('script');
fs.src = pathPrefix + 'js/font-settings.js';
document.head.appendChild(fs);
