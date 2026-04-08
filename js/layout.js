document.addEventListener("DOMContentLoaded", () => {
    // 1. 階層の深さを判定（トップなら ./ 、子ページなら ../ ）
    const pathPrefix = document.location.pathname.endsWith('/') && document.location.pathname.split('/').length <= 2 || document.location.pathname.endsWith('index.html') && document.location.pathname.split('/').length <= 2 ? "./" : "../";
    const homeLink = pathPrefix;

    // 2. ヘッダーの書き換え
    const header = document.querySelector(".page-header");
    if (header) {
        // 赤いロゴ(01)を配置し、トップページへのリンクを貼る
        header.innerHTML = `
            <div class="header-inner">
                <a href="${homeLink}" class="logo-link">
                    <img src="${pathPrefix}matsushimachihiro01.png" alt="logo" class="header-logo">
                </a>
            </div>
        `;
    }

    // 3. フッターの書き換え
    const footer = document.querySelector(".page-footer");
    if (footer) {
        // 手書き署名(02)のみを配置
        footer.innerHTML = `
            <img src="${pathPrefix}matsushimachihiro02.png" alt="" class="handwritten-footer">
        `;
    }
});
