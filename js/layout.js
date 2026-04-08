document.addEventListener("DOMContentLoaded", () => {
    // 1. 階層の判定（もっと確実にしました）
    // ルートにあるファイル（index.html等）かどうかをチェック
    const isTop = !window.location.pathname.includes('/work/') && 
                  !window.location.pathname.includes('/comicdiary/') && 
                  !window.location.pathname.includes('/diary/') && 
                  !window.location.pathname.includes('/about/') && 
                  !window.location.pathname.includes('/photo/');
    const pathPrefix = isTop ? "./" : "../";

    // 2. ヘッダーの処理（壊さないように慎重に）
    const header = document.querySelector(".page-header");
    if (header) {
        // すでにロゴがない場合だけ追加する
        if (!header.querySelector(".header-logo")) {
            const logoLink = document.createElement('a');
            logoLink.href = pathPrefix;
            logoLink.className = "logo-link";
            logoLink.innerHTML = `<img src="${pathPrefix}matsushimachihiro01.png" class="header-logo">`;
            // 一番前（タイトルや戻るボタンの前）にロゴを差し込む
            header.prepend(logoLink);
        }
    }

    // 3. フッターの処理
    const footer = document.querySelector(".page-footer");
    if (footer) {
        if (!footer.querySelector(".handwritten-footer")) {
            footer.innerHTML = `<img src="${pathPrefix}matsushimachihiro02.png" class="handwritten-footer">`;
        }
    }
});
