document.addEventListener("DOMContentLoaded", () => {
    // 1. 階層の判定（フォルダ名が含まれていれば子ページ、なければトップ）
    const path = window.location.pathname;
    const isSub = path.includes('/work/') || path.includes('/comicdiary/') || path.includes('/diary/') || path.includes('/about/') || path.includes('/photo/');
    const prefix = isSub ? "../" : "./";

    // 2. ヘッダーの処理
    const header = document.querySelector(".page-header");
    if (header) {
        // ロゴを一番前に追加（既存のタイトルは壊しません）
        if (!header.querySelector(".header-logo")) {
            const logoA = document.createElement('a');
            logoA.href = prefix;
            logoA.className = "logo-link";
            logoA.style.border = "none";
            logoA.innerHTML = `<img src="${prefix}matsushimachihiro01.png" class="header-logo" style="width:180px; height:auto; display:block; margin-bottom:10px;">`;
            header.prepend(logoA);
        }
    }

    // 3. フッターの処理
    const footer = document.querySelector(".page-footer");
    if (footer) {
        footer.innerHTML = `<img src="${prefix}matsushimachihiro02.png" class="handwritten-footer" style="width:260px; height:auto; display:block; margin:60px auto;">`;
    }
});
