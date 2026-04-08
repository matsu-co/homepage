document.addEventListener("DOMContentLoaded", () => {
  // 1. 階層の判定（フォルダ名が含まれていれば子ページ）
  const path = window.location.pathname;
  const isSub = path.includes('work') || path.includes('comicdiary') || path.includes('diary') || path.includes('about') || path.includes('photo');
  const prefix = isSub ? "../" : "./";

  // 2. ヘッダーの処理
  const header = document.querySelector(".page-header");
  if (header) {
    if (!header.querySelector(".header-logo")) {
      const logoA = document.createElement('a');
      logoA.href = prefix;
      logoA.className = "logo-link";
      logoA.style.border = "none";
      // バックティック（`）を正しく使用
      logoA.innerHTML = `<img src="${prefix}matsushimachihiro01.png" class="header-logo">`;
      header.prepend(logoA);
    }
  }

  // 3. フッターの処理
  const footer = document.querySelector(".page-footer");
  if (footer) {
    footer.innerHTML = `<img src="${prefix}matsushimachihiro02.png" class="handwritten-footer">`;
  }
});
