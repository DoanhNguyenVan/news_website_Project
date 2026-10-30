/**
 * =========================================================================================
 * NEWPORTAL HYBRID 2.0 I18N SYSTEM (Spring Boot i18n + Client Widget)
 * 
 * Kiến trúc 3 tầng phân tách:
 * - Tầng 1: UI tĩnh (Menu, Button, Footer, Labels) dịch tức thì 0ms qua Dictionary & [data-i18n].
 * - Tầng 2: Số liệu, Ngày giờ, Tác giả, % Polls bảo vệ 100% bằng lớp chắn `translate="no"` & `.notranslate` + Intl.
 * - Tầng 3: Nội dung động (Bài viết, Bình luận) dịch cục bộ qua Google Translate Engine.
 * 
 * Xử lý 3 "Bẫy ngầm" môi trường production (Render / Cloud):
 * 1. Khôi phục Tiếng Việt (VI) 0ms KHÔNG cần reload trang nhờ cơ chế In-Memory DOM Snapshot.
 * 2. Triệt tiêu Race Condition: Tầng 1 & 2 chạy đồng bộ trước khi Tầng 3 quét DOM.
 * 3. Tự động khắc phục nghẽn mạng của element.js qua cơ chế Auto-Retry (tối đa 3 lần, delay 1.5s).
 * =========================================================================================
 */
(function() {
  'use strict';

  // ============================================================================
  // 1. TỪ ĐIỂN TĨNH BẢN ĐỊA HÓA (TẦNG 1: UI DICTIONARY - 0ms LATENCY)
  // ============================================================================
  const UI_DICT = {
    vi: {
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

  // Trạng thái hệ thống
  let currentLang = localStorage.getItem('newsportal_lang') || 'vi';
  let isGoogleTranslateReady = false;
  let pendingTargetLang = null;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  // In-Memory Cache lưu trữ HTML nguyên bản của các vùng động (BẪY NGẦM 1)
  const dynamicContentSnapshot = new Map();

  // ============================================================================
  // 2. CSS BẢO VỆ LAYOUT & TRIỆT TIÊU BANNER GOOGLE TRANSLATE 100%
  // ============================================================================
  const style = document.createElement('style');
  style.id = 'hybrid-i18n-styles';
  style.textContent = `
    /* Triệt tiêu 100% mọi banner, iframe và thanh đẩy tụt của Google Translate */
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

    /* Modern Editorial Language Switcher Pill */
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

    /* Light Variant cho Header Admin */
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

  // Khắc phục triệt để lỗi Google Translate đẩy tụt body
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

  // Thẻ container ẩn cho Google Translate
  let gtDiv = document.getElementById('google_translate_element');
  if (!gtDiv) {
    gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.className = 'notranslate';
    gtDiv.setAttribute('translate', 'no');
    document.body.appendChild(gtDiv);
  }

  // ============================================================================
  // 3. TẦNG 1: THI CÔNG DỊCH GIAO DIỆN TĨNH (DATA-I18N - TỐC ĐỘ 1ms)
  // ============================================================================
  function applyStaticTranslations(lang) {
    const dict = UI_DICT[lang] || UI_DICT.vi;
    
    // Quét các thẻ có data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Quét các thẻ input/textarea có data-i18n-ph (placeholder)
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // Tự động map một số phần tử cốt lõi phổ biến nếu chưa có data-i18n
    const searchInput = document.getElementById('search-input') || document.getElementById('global-header-search');
    if (searchInput) searchInput.placeholder = dict["search.placeholder"];
  }

  // ============================================================================
  // 4. TẦNG 2: BẢO VỆ SỐ LIỆU, INTEL VÀ LAYOUT (NOTRANSLATE & INTL)
  // ============================================================================
  function protectMetricsAndLayout() {
    // 1. Toàn bộ Header, Navbar, Sidebar và Footer được gắn notranslate để Google bỏ qua
    const safeSelectors = [
      'header',
      'nav',
      '#mobile-drawer',
      '#admin-sidebar',
      'footer',
      '.np-lang-pill',
      '#theme-toggle-btn',
      '#sidebar-collapse-btn',
      '.news-img-zoom',
      'svg',
      'canvas'
    ];
    safeSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.add('notranslate');
        el.setAttribute('translate', 'no');
      });
    });

    // 2. Bảo vệ các vùng chứa số liệu (Số lượt xem, Thời gian, Tác giả, % Polls)
    const metricSelectors = [
      '.view-count',
      '.read-time',
      '.rel-time',
      '.poll-percentage',
      '.poll-votes',
      '.series-order',
      'time',
      'strong.byline'
    ];
    metricSelectors.forEach(sel => {
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
    '#article-content-body',
    '#comments-list',
    '#search-results-container',
    '#admin-posts-table'
  ];

  function snapshotDynamicContent() {
    DYNAMIC_CONTAINERS.forEach(sel => {
      const el = document.querySelector(sel);
      if (el && el.innerHTML.trim().length > 0 && !dynamicContentSnapshot.has(sel)) {
        // Lưu lại bản HTML Tiếng Việt nguyên vẹn trước khi Google Translate can thiệp
        dynamicContentSnapshot.set(sel, el.innerHTML);
      }
    });
  }

  function restoreOriginalVietnameseContent() {
    // Khôi phục ngay lập tức bản gốc Tiếng Việt 100% không dính thẻ <font> của Google
    dynamicContentSnapshot.forEach((savedHtml, sel) => {
      const el = document.querySelector(sel);
      if (el && savedHtml) {
        el.innerHTML = savedHtml;
      }
    });
  }

  // ============================================================================
  // 6. BẪY NGẦM 2: TRÁNH RACE CONDITION KHI CHUYỂN NGÔN NGỮ
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
      // 1. Chạy Tầng 1: Đổi từ điển sang Tiếng Việt (1ms)
      applyStaticTranslations('vi');
      currentLang = 'vi';
      localStorage.setItem('newsportal_lang', 'vi');
      updatePillButtons('vi', false);

      // 2. Chạy Tầng 3: Khôi phục Snapshot nguyên bản (0ms - Không reload trang)
      restoreOriginalVietnameseContent();

      // 3. Reset Google Translate combo về rỗng / vi
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = '';
        combo.dispatchEvent(new Event('change'));
      }

      // 4. Xóa sạch mọi cookie dịch
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
      // BƯỚC A (ĐỒNG BỘ): Chụp snapshot Tiếng Việt ngay trước khi dịch
      snapshotDynamicContent();

      // BƯỚC B (ĐỒNG BỘ): Chạy Tầng 1 (data-i18n) và Tầng 2 (Lớp chắn notranslate)
      applyStaticTranslations('en');
      protectMetricsAndLayout();

      currentLang = 'en';
      localStorage.setItem('newsportal_lang', 'en');

      // BƯỚC C (BẤT ĐỒNG BỘ): Kích hoạt Tầng 3 (Google Translate chỉ dịch các vùng bài viết)
      if (isGoogleTranslateReady) {
        triggerGoogleTranslateToEn();
        updatePillButtons('en', false);
      } else {
        // Nếu script Google đang load hoặc retry, lưu cờ chờ
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

  // ============================================================================
  // 7. BẪY NGẦM 3: AUTO-RETRY CHO ELEMENT.JS KHI NGHẼN MẠNG TRÊN CLOUD / RENDER
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

      // Nếu có yêu cầu chuyển EN đang chờ lúc script nạp dở
      if (pendingTargetLang === 'en' || currentLang === 'en') {
        setTimeout(() => {
          triggerGoogleTranslateToEn();
          updatePillButtons('en', false);
          pendingTargetLang = null;
        }, 300);
      }
    } catch (err) {
      handleScriptLoadFailure('Khởi tạo TranslateElement lỗi: ' + err.message);
    }
  };

  function handleScriptLoadFailure(reason) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.warn(`[Hybrid i18n] element.js chậm (${reason}), đang tự động thử lại lần ${retryCount}/${MAX_RETRIES}...`);
      setTimeout(() => {
        loadGoogleTranslateScript(true);
      }, 1500);
    } else {
      console.warn('[Hybrid i18n] element.js không phản hồi sau 3 lần retry. Giữ nguyên dịch giao diện tĩnh Tầng 1.');
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
    gtScript.onerror = () => handleScriptLoadFailure('Lỗi mạng tải CDN Google Translate');
    document.head.appendChild(gtScript);

    // Timeout kiểm tra sau 4s nếu callback không kích hoạt
    setTimeout(() => {
      if (!isGoogleTranslateReady && retryCount < MAX_RETRIES) {
        handleScriptLoadFailure('Timeout 4s không có phản hồi');
      }
    }, 4000);
  }

  // ============================================================================
  // 8. TỰ ĐỘNG CHÈN NÚT CHUYỂN ĐỔI NGÔN NGỮ (PILL WIDGET) VÀO HEADER
  // ============================================================================
  function createPillElement(isLightVariant = false) {
    const pill = document.createElement('div');
    pill.className = `np-lang-pill ${isLightVariant ? 'np-lang-pill-light' : ''} notranslate`;
    pill.setAttribute('translate', 'no');
    pill.title = 'Chuyển đổi ngôn ngữ / Switch Language (Hybrid 2.0)';
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
    // 1. Áp dụng bảo vệ layout và metrics ngay khi DOM tải
    protectMetricsAndLayout();

    // 2. Nếu người dùng đã chọn English từ trước
    if (currentLang === 'en') {
      applyStaticTranslations('en');
      loadGoogleTranslateScript();
    }

    // 3. Tự động gắn nút vào Header công khai (trước #theme-toggle-btn)
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn && themeBtn.parentNode && !document.querySelector('.np-lang-pill')) {
      const pill = createPillElement(false);
      themeBtn.parentNode.insertBefore(pill, themeBtn);
      return;
    }

    // 4. Hoặc gắn vào Header của Admin Portal
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
