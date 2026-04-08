document.addEventListener("DOMContentLoaded", () => {
    // フォルダ名が含まれていなければ「トップページ」と判定する
    const isSubPage = window.location.pathname.includes('/work/') || 
                      window.location.pathname.includes('/comicdiary/') || 
                      window.location.pathname.includes('/diary/') || 
                      window.location.pathname.includes('/about/') || 
                      window.location.pathname.includes('/photo/');
    const prefix = isSubPage ? "../" : "./";

    // ヘッダーにロゴを追加
    const header = document.querySelector(".page-header");
    if (header && !header.querySelector(".header-logo")) {
        const a = document.createElement('a');
        a.href = prefix;
        a.className = "logo-link";
        a.innerHTML = `<img src="${prefix}matsushimachihiro01.png" class="header-logo" style="width:180px; height:auto; display:block;">`;
        header.prepend(a);
    }

    // フッターに署名を追加
    const footer = document.querySelector(".page-footer");
    if (footer && !footer.querySelector(".handwritten-footer")) {
        footer.innerHTML = `<img src="${prefix}matsushimachihiro02.png" class="handwritten-footer" style="width:260px; height:auto; display:block; margin:60px auto;">`;
    }
});
