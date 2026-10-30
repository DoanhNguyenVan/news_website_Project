/**
 * =========================================================================================
 * NEWPORTAL 1-CLICK INSTANT LANGUAGE SWITCHER (Tiếng Việt 🇻🇳 / English 🇬🇧)
 * 
 * - Single Source of Truth: Đồng bộ 100% giữa Cookie dịch thuật và Trạng thái Nút (Pill).
 * - Chuyển sang VI: Dọn sạch triệt để mọi cookie dịch thuật và tải lại trang gốc nguyên bản 100%.
 * - Chuyển sang EN:
 *     + UI tĩnh & Chuyên mục đổi sang tiếng Anh tức thì 0ms (CATEGORY_MAP).
 *     + Tự động kích hoạt Google Translate sau khi API nạp xong bài viết (onDynamicContentReady),
 *       đảm bảo Tiêu đề, Sapo, Nội dung bài báo được dịch chuẩn xác 100% giống trang Admin.
 * - Triệt tiêu 100% thanh iframe banner Google Translate, không gây tụt lề body (0px top).
 * =========================================================================================
 */
(function() {
  'use strict';

  // 1. Kiểm tra ngôn ngữ thực tế đang kích hoạt
  function getEffectiveLang() {
    const cookie = document.cookie || '';
    if (cookie.includes('googtrans=/vi/en') || cookie.includes('googtrans=/auto/en')) {
      return 'en';
    }
    const saved = localStorage.getItem('newsportal_lang');
    if (saved === 'en') {
      return 'en';
    }
    return 'vi';
  }

  let currentLang = getEffectiveLang();

  // Từ điển chuyên mục chuẩn quốc tế cho báo chí
  const CATEGORY_MAP = {
    "thoi-su": "Current Affairs",
    "thoi-su-giang-duong": "Campus News",
    "phong-su-dieu-tra": "Investigative",
    "goc-nhin-binh-luan": "Perspectives",
    "van-hoa-doi-song": "Culture & Life",
    "cong-nghe-khoi-nghiep": "Tech & Startups",
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
  };

  // 2. Chèn CSS điều khiển giao diện pill & triệt tiêu banner Google Translate
  const style = document.createElement('style');
  style.id = 'newsportal-lang-styles';
  style.textContent = `
    /* Triệt tiêu 100% banner, iframe và thanh đẩy tụt của Google Translate */
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
      color: #94a3b8 !important;
      background: transparent !important;
      border: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      line-height: 1.2;
    }
    .np-lang-btn:hover {
      color: #ffffff !important;
    }
    .np-lang-btn.active {
      background: #2563eb !important;
      color: #ffffff !important;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2);
    }

    /* Admin header variant */
    .np-lang-pill-light {
      background: #f1f5f9;
      border-color: #e2e8f0;
    }
    .np-lang-pill-light:hover {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }
    .np-lang-pill-light .np-lang-btn {
      color: #64748b !important;
    }
    .np-lang-pill-light .np-lang-btn:hover {
      color: #0f172a !important;
    }
    .np-lang-pill-light .np-lang-btn.active {
      background: #2563eb !important;
      color: #ffffff !important;
    }
  `;
  document.head.appendChild(style);

  // 3. Khắc phục triệt để lỗi Google Translate đẩy tụt body
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

  // 4. Container ẩn cho Google Translate
  let gtDiv = document.getElementById('google_translate_element');
  if (!gtDiv) {
    gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.className = 'notranslate';
    gtDiv.setAttribute('translate', 'no');
    document.body.appendChild(gtDiv);
  }

  // 5. Cập nhật giao diện nút bấm (Active Tab)
  function updatePillButtons(lang) {
    document.querySelectorAll('.np-lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Áp dụng tiếng Anh tức thì 0ms cho các thành phần UI tĩnh & Chuyên mục
  function applyInstantEnglishUI() {
    // 1. Chuyên mục trên Navbar, Drawer, Footer, và các thẻ tag bài viết
    document.querySelectorAll('[data-category-slug]').forEach(el => {
      const slug = el.getAttribute('data-category-slug');
      if (CATEGORY_MAP[slug]) {
        el.textContent = CATEGORY_MAP[slug].toUpperCase();
      }
    });

    // 2. Link Trang chủ
    document.querySelectorAll('[data-i18n="nav.home"], a[href="index.html"]').forEach(el => {
      const text = el.textContent.trim().toLowerCase();
      if (text === 'trang chủ') {
        el.textContent = 'HOME';
      }
    });

    // 3. Slogan tòa soạn
    const slogan = document.querySelector('[data-i18n="header.slogan"]');
    if (slogan) {
      slogan.textContent = 'Independent • Objective • Multidimensional Information';
    }

    // 4. Nút thao tác bài viết
    const bookmarkText = document.getElementById('bookmark-text');
    if (bookmarkText) {
      const isSaved = bookmarkText.textContent.includes('Đã') || bookmarkText.textContent.includes('Saved');
      bookmarkText.textContent = isSaved ? 'Saved' : 'Save';
    }

    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
      const span = copyBtn.querySelector('span');
      if (span && span.textContent.includes('Sao chép')) span.textContent = 'Copy';
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = 'Search articles (Press Enter)...';
  }

  // 6. Kích hoạt quét dịch Google Translate
  function triggerGoogleTranslate() {
    if (!document.getElementById('gt-element-script')) {
      loadGoogleTranslateScript();
      return;
    }

    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      // Đặt về rỗng rồi chuyển sang 'en' để Google Translate luôn quét lại các bài viết mới nạp
      combo.value = '';
      combo.dispatchEvent(new Event('change'));
      setTimeout(() => {
        combo.value = 'en';
        combo.dispatchEvent(new Event('change'));
        enforceZeroBodyTop();
      }, 60);
    }
  }

  // Hook nhận diện khi REST API nạp bài viết / danh mục mới vào DOM (Đọc báo công khai)
  window.onDynamicContentReady = function() {
    if (getEffectiveLang() === 'en') {
      applyInstantEnglishUI();
      setTimeout(triggerGoogleTranslate, 100);
    }
  };

  // 7. Hàm chuyển đổi ngôn ngữ toàn cục
  window.switchNewsPortalLang = function(targetLang) {
    const hostname = window.location.hostname;

    if (targetLang === 'vi') {
      localStorage.setItem('newsportal_lang', 'vi');
      currentLang = 'vi';
      updatePillButtons('vi');

      // Dọn sạch triệt để cookie dịch thuật trên mọi domain và path
      const domains = [hostname, '.' + hostname, ''];
      const paths = ['/', '', window.location.pathname];
      const past = 'Thu, 01 Jan 1970 00:00:00 UTC';
      domains.forEach(d => {
        paths.forEach(p => {
          document.cookie = `googtrans=; expires=${past}; path=${p}; domain=${d};`;
          document.cookie = `googtrans=/vi/vi; expires=${past}; path=${p}; domain=${d};`;
          document.cookie = `googtrans=; expires=${past}; path=${p};`;
        });
      });

      // Tải lại trang: 100% nội dung tiếng Việt gốc sạch sẽ được phục hồi trong 100ms
      window.location.reload();
      return;
    }

    if (targetLang === 'en') {
      localStorage.setItem('newsportal_lang', 'en');
      currentLang = 'en';
      updatePillButtons('en');

      // Đặt cookie chuyển sang Tiếng Anh
      document.cookie = `googtrans=/vi/en; path=/;`;
      if (hostname && hostname !== 'localhost') {
        document.cookie = `googtrans=/vi/en; path=/; domain=.${hostname};`;
      }

      applyInstantEnglishUI();

      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        triggerGoogleTranslate();
      } else {
        window.location.reload();
      }
    }
  };

  // 8. Khởi tạo Google Translate Element
  window.googleTranslateElementInit = function() {
    try {
      new window.google.translate.TranslateElement({
        pageLanguage: 'vi',
        includedLanguages: 'en,vi',
        autoDisplay: false
      }, 'google_translate_element');

      enforceZeroBodyTop();

      if (currentLang === 'en') {
        setTimeout(() => {
          const combo = document.querySelector('.goog-te-combo');
          if (combo && combo.value !== 'en') {
            combo.value = 'en';
            combo.dispatchEvent(new Event('change'));
          }
          enforceZeroBodyTop();
        }, 300);
      }
    } catch (e) {
      // Safe
    }
  };

  // 9. Tải script Google Translate nếu đang ở chế độ Tiếng Anh
  function loadGoogleTranslateScript() {
    if (document.getElementById('gt-element-script')) return;
    const gtScript = document.createElement('script');
    gtScript.id = 'gt-element-script';
    gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    gtScript.async = true;
    document.head.appendChild(gtScript);
  }

  // 10. Sinh HTML cho Language Pill Widget
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

  // 11. Tự động chèn nút vào Header khi DOM sẵn sàng
  function mountLanguageSwitcher() {
    currentLang = getEffectiveLang();

    if (currentLang === 'vi') {
      const past = 'Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = `googtrans=; expires=${past}; path=/;`;
    } else {
      // Chế độ EN:
      applyInstantEnglishUI();

      if (document.getElementById('admin-sidebar') || document.getElementById('stat-total-views')) {
        // Trang Admin: Nội dung tĩnh có sẵn, nạp script ngay lập tức
        loadGoogleTranslateScript();
      } else {
        // Trang đọc báo công khai: nạp script và dự phòng quét dịch sau khi bài viết nạp xong
        setTimeout(() => {
          triggerGoogleTranslate();
        }, 500);
      }
    }

    // A. Header công khai (trước nút Theme Toggle)
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn && themeBtn.parentNode && !document.querySelector('.np-lang-pill')) {
      const pill = createPillElement(false);
      themeBtn.parentNode.insertBefore(pill, themeBtn);
      return;
    }

    // B. Header Admin Portal
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
