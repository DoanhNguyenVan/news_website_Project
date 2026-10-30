/**
 * =========================================================================================
 * NEWPORTAL HYBRID 2.0 I18N SYSTEM (Spring Boot i18n + Client Widget) - REFINED
 * 
 * - Tầng 1 (0ms): Dịch tức thì UI Layout, Menu Chuyên mục, Nút bấm, Slogan qua Dictionary.
 * - Tầng 2: Bảo vệ các thành phần hệ thống nhạy cảm (.np-lang-pill, svg, canvas).
 *   QUAN TRỌNG: KHÔNG khóa translate="no" trên header, nav, footer để Tiêu đề bài viết,
 *   Sapo, Menu chuyên mục và Tác giả được dịch sang tiếng Anh trọn vẹn 100%!
 * - Tầng 3: Tự động kích hoạt dịch lại (Re-trigger) ngay khi REST API fetch xong bài viết.
 * - Snapshot DOM: Khôi phục tiếng Việt 0ms không cần reload trang.
 * =========================================================================================
 */
(function() {
  'use strict';

  // ============================================================================
  // 1. TỪ ĐIỂN TĨNH BẢN ĐỊA HÓA (UI DICTIONARY & DANH MỤC - 0ms TỨC THÌ)
  // ============================================================================
  const UI_DICT = {
    vi: {
      "header.slogan": "Thông Tin Độc Lập • Khách Quan • Đa Chiều",
      "nav.home": "Trang chủ",
      "nav.trending": "Xu hướng",
      "nav.categories": "Chuyên mục",
      "nav.admin": "Quản trị CMS",
      "nav.bookmarks": "Bài viết đã lưu",
      "nav.history": "Lịch sử đọc",
      "nav.profile": "Tài khoản",
      "nav.login": "Đăng nhập",
      "nav.register": "Đăng ký",
      "nav.logout": "Đăng xuất",
      "search.placeholder": "Tìm kiếm bài viết (Enter để lọc)...",
      "btn.save": "Lưu bài",
      "btn.saved": "Đã lưu",
      "btn.copy": "Sao chép",
      "btn.copied": "Đã sao chép",
      "btn.share": "Chia sẻ",
      "btn.read_more": "Đọc tiếp",
      "btn.comment": "Bình luận",
      "btn.vote": "Bình chọn",
      "btn.voted": "Đã bình chọn",
      "poll.title": "Khảo Sát Độc Giả",
      "poll.badge": "TƯƠNG TÁC",
      "spotlight.badge": "TIN TIÊU ĐIỂM SPOTLIGHT",
      "spotlight.sub": "Ấn phẩm Biên tập Đặc biệt",
      "personalized.title": "DÀNH CHO BẠN (AI ĐỀ XUẤT)",
      "popular.title": "ĐỌC NHIỀU NHẤT 24H",
      "theme.dark": "Chế độ tối",
      "theme.light": "Chế độ sáng",
      "footer.editorial": "Editorial SaaS Suite — Tòa soạn Báo chí Kỹ thuật số",
      "footer.rights": "Bản quyền thuộc về Tòa soạn Báo chí NewsPortal.",
      "article.author": "Tác giả:",
      "article.views": "lượt xem",
      "article.reading_time": "phút đọc",
      "admin.dashboard": "Bảng điều khiển",
      "admin.posts": "Quản lý Bài viết",
      "admin.categories": "Quản lý Chuyên mục",
      "admin.users": "Người dùng & RBAC",
      "admin.comments": "Quản lý Bình luận",
      "admin.media": "Thư viện Media DAM",
      "admin.ads": "Banner & Quảng cáo",
      "admin.polls": "Thăm dò Ý kiến (Polls)",
      "admin.settings": "Cài đặt & Cache"
    },
    en: {
      "header.slogan": "Independent • Objective • Multidimensional Information",
      "nav.home": "Home",
      "nav.trending": "Trending",
      "nav.categories": "Categories",
      "nav.admin": "CMS Admin",
      "nav.bookmarks": "Saved Articles",
      "nav.history": "Reading History",
      "nav.profile": "My Account",
      "nav.login": "Sign In",
      "nav.register": "Sign Up",
      "nav.logout": "Sign Out",
      "search.placeholder": "Search articles (Press Enter)...",
      "btn.save": "Save",
      "btn.saved": "Saved",
      "btn.copy": "Copy link",
      "btn.copied": "Copied",
      "btn.share": "Share",
      "btn.read_more": "Read More",
      "btn.comment": "Comment",
      "btn.vote": "Vote",
      "btn.voted": "Voted",
      "poll.title": "Reader Survey",
      "poll.badge": "INTERACTIVE",
      "spotlight.badge": "SPOTLIGHT EDITORIAL",
      "spotlight.sub": "Special Editorial Edition",
      "personalized.title": "PERSONALIZED FOR YOU",
      "popular.title": "MOST READ ARTICLES (24H)",
      "theme.dark": "Dark mode",
      "theme.light": "Light mode",
      "footer.editorial": "Editorial SaaS Suite — Digital Publishing Platform",
      "footer.rights": "All rights reserved by NewsPortal Editorial Suite.",
      "article.author": "Author:",
      "article.views": "views",
      "article.reading_time": "min read",
      "admin.dashboard": "Dashboard",
      "admin.posts": "Articles Management",
      "admin.categories": "Categories",
      "admin.users": "Users & RBAC",
      "admin.comments": "Comment Moderation",
      "admin.media": "Media DAM Library",
      "admin.ads": "Banners & Ads",
      "admin.polls": "Opinion Polls",
      "admin.settings": "Settings & Cache"
    }
  };

  // Từ điển danh mục tin tức (chuyển đổi 0ms cho Navbar)
  const CATEGORY_MAP = {
    vi: {
      "thoi-su": "Thời sự",
      "the-gioi": "Thế giới",
      "kinh-doanh": "Kinh doanh",
      "cong-nghe": "Công nghệ",
      "the-thao": "Thể thao",
      "giai-tri": "Giải trí",
      "suc-khoe": "Sức khỏe",
      "giao-duc": "Giáo dục",
      "phap-luat": "Pháp luật",
      "ai-blockchain": "AI & Blockchain",
      "meme": "Meme"
    },
    en: {
      "thoi-su": "Current Affairs",
      "the-gioi": "World",
      "kinh-doanh": "Business",
      "cong-nghe": "Technology",
      "the-thao": "Sports",
      "giai-tri": "Entertainment",
      "suc-khoe": "Health",
      "giao-duc": "Education",
      "phap-luat": "Law & Justice",
      "ai-blockchain": "AI & Blockchain",
      "meme": "Humor & Meme"
    }
  };

  let currentLang = localStorage.getItem('newsportal_lang') || 'vi';
  let isGoogleTranslateReady = false;
  let pendingTargetLang = null;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  // In-Memory Cache lưu trữ HTML nguyên bản của các vùng động
  const dynamicContentSnapshot = new Map();

  // ============================================================================
  // 2. CSS BẢO VỆ LAYOUT & TRIỆT TIÊU BANNER GOOGLE TRANSLATE 100%
  // ============================================================================
  const style = document.createElement('style');
  style.id = 'hybrid-i18n-styles';
  style.textContent = `
    .goog-te-banner-frame,
    .goog-te-banner-frame.skiptranslate,
    iframe.goog-te-banner-frame,
    iframe.skiptranslate,
    iframe[class*="VIpgJd"],
    iframe[class*="goog"],
    .VIpgJd-ZVi9od-ORHb-Oxf5Ak,
    .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
    .VIpgJd-ZVi9od-vH1Gmf,
    #goog-gt-tt,
    .goog-tooltip,
    .goog-te-balloon-frame {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      max-height: 0 !important;
      pointer-events: none !important;
    }
    body {
      top: 0px !important;
      position: static !important;
    }
    #google_translate_element {
      display: none !important;
      position: absolute !important;
      visibility: hidden !important;
      left: -9999px !important;
    }
    .goog-text-highlight {
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    .np-lang-pill {
      display: inline-flex;
      align-items: center;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(71, 85, 105, 0.6);
      border-radius: 9999px;
      padding: 2px;
      gap: 2px;
      user-select: none;
      transition: all 0.2s ease;
    }
    .np-lang-pill:hover {
      background: rgba(30, 41, 59, 0.95);
      border-color: rgba(100, 116, 139, 0.8);
    }
    .np-lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      line-height: 1.2;
    }
    .np-lang-btn:hover {
      color: #ffffff;
    }
    .np-lang-btn.active {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2);
    }
    .np-lang-btn.loading {
      opacity: 0.7;
      animation: langPulse 1s infinite alternate;
    }
    @keyframes langPulse {
      0% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .np-lang-pill-light {
      background: #f1f5f9;
      border-color: #e2e8f0;
    }
    .np-lang-pill-light:hover {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }
    .np-lang-pill-light .np-lang-btn {
      color: #64748b;
    }
    .np-lang-pill-light .np-lang-btn:hover {
      color: #0f172a;
    }
    .np-lang-pill-light .np-lang-btn.active {
      background: #2563eb;
      color: #ffffff;
    }
  `;
  document.head.appendChild(style);

  function enforceZeroBodyTop() {
    if (document.body && document.body.style.top && document.body.style.top !== '0px') {
      document.body.style.top = '0px';
      document.body.style.position = 'static';
    }
    document.querySelectorAll('iframe.goog-te-banner-frame, iframe[class*="VIpgJd"], iframe[class*="goog"], .goog-te-banner-frame').forEach(el => {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.height = '0';
    });
  }
  const observer = new MutationObserver(enforceZeroBodyTop);
  observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
  setInterval(enforceZeroBodyTop, 300);

  let gtDiv = document.getElementById('google_translate_element');
  if (!gtDiv) {
    gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.className = 'notranslate';
    gtDiv.setAttribute('translate', 'no');
    document.body.appendChild(gtDiv);
  }

  // ============================================================================
  // 3. TẦNG 1: DỊCH GIAO DIỆN TĨNH & MENU CHUYÊN MỤC (0ms)
  // ============================================================================
  function applyStaticTranslations(lang) {
    const dict = UI_DICT[lang] || UI_DICT.vi;
    
    // 1. Quét các thẻ có data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // 2. Quét các input có data-i18n-ph
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // 3. Dịch tức thì toàn bộ Menu Chuyên Mục trên Navbar & Mobile Drawer
    document.querySelectorAll('[data-category-slug]').forEach(a => {
      const slug = a.getAttribute('data-category-slug');
      if (CATEGORY_MAP[lang] && CATEGORY_MAP[lang][slug]) {
        a.textContent = CATEGORY_MAP[lang][slug].toUpperCase();
      }
    });

    // 4. Dịch các thành phần UI thông dụng
    const searchInput = document.getElementById('search-input') || document.getElementById('global-header-search');
    if (searchInput) searchInput.placeholder = dict["search.placeholder"];

    const bookmarkText = document.getElementById('bookmark-text');
    if (bookmarkText) {
      const isSaved = bookmarkText.textContent.includes('Đã') || bookmarkText.textContent.includes('Saved');
      bookmarkText.textContent = isSaved ? dict["btn.saved"] : dict["btn.save"];
    }

    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
      const copySpan = copyBtn.querySelector('span');
      if (copySpan) copySpan.textContent = dict["btn.copy"];
    }
  }

  // ============================================================================
  // 4. TẦNG 2: BẢO VỆ CÁC THÀNH PHẦN HỆ THỐNG
  // (CHÚ Ý: Không khóa header/nav/footer để bài viết & chuyên mục được dịch đầy đủ!)
  // ============================================================================
  function protectMetricsAndLayout() {
    // 1. Gỡ bỏ translate="no" nếu trước đó từng bị gán nhầm vào header/nav/footer
    document.querySelectorAll('header, nav, footer, #mobile-drawer, #admin-sidebar, #article-title, #article-sapo').forEach(el => {
      el.classList.remove('notranslate');
      el.removeAttribute('translate');
    });

    // 2. Chỉ bảo vệ các thành phần thực sự nhạy cảm
    const strictSafe = [
      '.np-lang-pill',
      '#sidebar-collapse-btn',
      'svg',
      'canvas'
    ];
    strictSafe.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.add('notranslate');
        el.setAttribute('translate', 'no');
      });
    });
  }

  // ============================================================================
  // 5. BẪY NGẦM 1: LƯU & KHÔI PHỤC SNAPSHOT DOM NGUYÊN BẢN (KHÔNG RELOAD)
  // ============================================================================
  const DYNAMIC_CONTAINERS = [
    '#spotlight-container',
    '#category-articles-container',
    '#personalized-container',
    '#popular-posts-sidebar',
    '#article-detail-container',
    '#article-content',
    '#comments-list',
    '#search-results-container'
  ];

  function snapshotDynamicContent() {
    DYNAMIC_CONTAINERS.forEach(sel => {
      const el = document.querySelector(sel);
      if (el && el.innerHTML.trim().length > 0 && !dynamicContentSnapshot.has(sel)) {
        dynamicContentSnapshot.set(sel, el.innerHTML);
      }
    });
    // Lưu thêm snapshot tiêu đề và sapo nếu ở trang chi tiết
    const titleEl = document.getElementById('article-title');
    if (titleEl && titleEl.textContent.trim()) {
      dynamicContentSnapshot.set('__article_title', titleEl.textContent);
    }
    const sapoEl = document.getElementById('article-sapo');
    if (sapoEl && sapoEl.textContent.trim()) {
      dynamicContentSnapshot.set('__article_sapo', sapoEl.textContent);
    }
  }

  function restoreOriginalVietnameseContent() {
    dynamicContentSnapshot.forEach((savedHtml, sel) => {
      if (sel === '__article_title') {
        const titleEl = document.getElementById('article-title');
        if (titleEl) titleEl.textContent = savedHtml;
        return;
      }
      if (sel === '__article_sapo') {
        const sapoEl = document.getElementById('article-sapo');
        if (sapoEl) sapoEl.textContent = savedHtml;
        return;
      }
      const el = document.querySelector(sel);
      if (el && savedHtml) {
        el.innerHTML = savedHtml;
      }
    });
  }

  // ============================================================================
  // 6. CHUYỂN ĐỔI NGÔN NGỮ (HYBRID 2.0)
  // ============================================================================
  function updatePillButtons(lang, isLoading = false) {
    document.querySelectorAll('.np-lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.classList.add('active');
        if (isLoading) btn.classList.add('loading');
        else btn.classList.remove('loading');
      } else {
        btn.classList.remove('active');
        btn.classList.remove('loading');
      }
    });
  }

  window.switchNewsPortalLang = function(targetLang) {
    const hostname = window.location.hostname;

    if (targetLang === 'vi') {
      applyStaticTranslations('vi');
      currentLang = 'vi';
      localStorage.setItem('newsportal_lang', 'vi');
      updatePillButtons('vi', false);

      restoreOriginalVietnameseContent();

      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = '';
        combo.dispatchEvent(new Event('change'));
      }

      const past = 'Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = `googtrans=; expires=${past}; path=/;`;
      document.cookie = `googtrans=/vi/vi; expires=${past}; path=/;`;
      if (hostname && hostname !== 'localhost') {
        document.cookie = `googtrans=; expires=${past}; path=/; domain=.${hostname};`;
        document.cookie = `googtrans=/vi/vi; expires=${past}; path=/; domain=.${hostname};`;
      }
      return;
    }

    if (targetLang === 'en') {
      snapshotDynamicContent();
      applyStaticTranslations('en');
      protectMetricsAndLayout();

      currentLang = 'en';
      localStorage.setItem('newsportal_lang', 'en');

      if (isGoogleTranslateReady) {
        triggerGoogleTranslateToEn();
        updatePillButtons('en', false);
      } else {
        pendingTargetLang = 'en';
        updatePillButtons('en', true);
        loadGoogleTranslateScript();
      }
    }
  };

  function triggerGoogleTranslateToEn() {
    const hostname = window.location.hostname;
    document.cookie = `googtrans=/vi/en; path=/;`;
    if (hostname && hostname !== 'localhost') {
      document.cookie = `googtrans=/vi/en; path=/; domain=.${hostname};`;
    }

    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      if (combo.value !== 'en') {
        combo.value = 'en';
        combo.dispatchEvent(new Event('change'));
      }
      enforceZeroBodyTop();
    }
  }

  // Hook nhận diện khi REST API nạp bài viết / danh mục mới vào DOM
  let retriggerTimer = null;
  window.notifyDynamicContentUpdated = function() {
    if (currentLang === 'en') {
      applyStaticTranslations('en');
      clearTimeout(retriggerTimer);
      retriggerTimer = setTimeout(() => {
        triggerGoogleTranslateToEn();
      }, 120);
    }
  };

  // ============================================================================
  // 7. AUTO-RETRY KHI NGHẼN MẠNG ELEMENT.JS TRÊN CLOUD
  // ============================================================================
  window.googleTranslateElementInit = function() {
    try {
      new window.google.translate.TranslateElement({
        pageLanguage: 'vi',
        includedLanguages: 'en,vi',
        autoDisplay: false
      }, 'google_translate_element');

      isGoogleTranslateReady = true;
      enforceZeroBodyTop();

      if (pendingTargetLang === 'en' || currentLang === 'en') {
        setTimeout(() => {
          triggerGoogleTranslateToEn();
          updatePillButtons('en', false);
          pendingTargetLang = null;
        }, 200);
      }
    } catch (err) {
      handleScriptLoadFailure('Khởi tạo lỗi: ' + err.message);
    }
  };

  function handleScriptLoadFailure(reason) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(() => {
        loadGoogleTranslateScript(true);
      }, 1500);
    } else {
      updatePillButtons(currentLang, false);
    }
  }

  function loadGoogleTranslateScript(forceReload = false) {
    if (isGoogleTranslateReady && !forceReload) return;

    if (forceReload) {
      const oldScript = document.getElementById('gt-element-script');
      if (oldScript) oldScript.remove();
    }

    const gtScript = document.createElement('script');
    gtScript.id = 'gt-element-script';
    gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    gtScript.async = true;
    gtScript.onerror = () => handleScriptLoadFailure('Lỗi tải CDN Google');
    document.head.appendChild(gtScript);

    setTimeout(() => {
      if (!isGoogleTranslateReady && retryCount < MAX_RETRIES) {
        handleScriptLoadFailure('Timeout 4s');
      }
    }, 4000);
  }

  // ============================================================================
  // 8. TỰ ĐỘNG GẮN NÚT CHUYỂN NGÔN NGỮ (PILL WIDGET)
  // ============================================================================
  function createPillElement(isLightVariant = false) {
    const pill = document.createElement('div');
    pill.className = `np-lang-pill ${isLightVariant ? 'np-lang-pill-light' : ''} notranslate`;
    pill.setAttribute('translate', 'no');
    pill.title = 'Chuyển đổi ngôn ngữ / Switch Language';
    pill.innerHTML = `
      <button type="button" class="np-lang-btn ${currentLang === 'vi' ? 'active' : ''}" data-lang="vi" onclick="window.switchNewsPortalLang('vi')" aria-label="Tiếng Việt">
        <span>🇻🇳</span><span>VI</span>
      </button>
      <button type="button" class="np-lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en" onclick="window.switchNewsPortalLang('en')" aria-label="English">
        <span>🇬🇧</span><span>EN</span>
      </button>
    `;
    return pill;
  }

  function mountLanguageSwitcher() {
    protectMetricsAndLayout();

    if (currentLang === 'en') {
      applyStaticTranslations('en');
      loadGoogleTranslateScript();
    }

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn && themeBtn.parentNode && !document.querySelector('.np-lang-pill')) {
      const pill = createPillElement(false);
      themeBtn.parentNode.insertBefore(pill, themeBtn);
      return;
    }

    const adminHeaderRight = document.querySelector('header .flex.items-center.gap-4') || document.querySelector('header .flex.items-center.gap-3');
    if (adminHeaderRight && !document.querySelector('.np-lang-pill')) {
      const pill = createPillElement(true);
      adminHeaderRight.insertBefore(pill, adminHeaderRight.firstChild);
      return;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLanguageSwitcher);
  } else {
    mountLanguageSwitcher();
  }
})();
