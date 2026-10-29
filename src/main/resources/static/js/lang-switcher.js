/**
 * NewsPortal 1-Click Instant Language Switcher (Tiếng Việt 🇻🇳 / English 🇬🇧)
 * Seamlessly translates entire website including articles, titles, menus, and comments.
 */
(function() {
  'use strict';

  // 1. Inject CSS for language switch pill and hide Google Translate toolbar/banner
  const style = document.createElement('style');
  style.id = 'newsportal-lang-styles';
  style.textContent = `
    /* Hide all Google Translate default ugly bars, tooltips & banners */
    .goog-te-banner-frame,
    .goog-te-banner-frame.skiptranslate,
    iframe.goog-te-banner-frame {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
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
    .goog-tooltip,
    .goog-tooltip:hover,
    #goog-gt-tt {
      display: none !important;
      visibility: hidden !important;
    }
    .goog-text-highlight {
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* Custom Modern Editorial Language Pill */
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

    /* Admin top header specific pill variant */
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

  // 2. Hidden container for Google Translate Element
  const gtDiv = document.createElement('div');
  gtDiv.id = 'google_translate_element';
  document.body.appendChild(gtDiv);

  // 3. Current active language: default 'vi'
  let currentLang = localStorage.getItem('newsportal_lang') || 'vi';

  // Check if cookie already says en
  if (document.cookie.includes('googtrans=/vi/en') || document.cookie.includes('googtrans=/auto/en')) {
    currentLang = 'en';
  }

  // 4. Update UI Buttons
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

  // 5. Global function to switch language
  window.switchNewsPortalLang = function(targetLang) {
    if (targetLang === currentLang) return;

    currentLang = targetLang;
    localStorage.setItem('newsportal_lang', targetLang);
    updatePillButtons(targetLang);

    // Apply via Google Translate
    const domain = window.location.hostname;
    if (targetLang === 'en') {
      document.cookie = "googtrans=/vi/en; path=/;";
      document.cookie = `googtrans=/vi/en; path=/; domain=${domain};`;
    } else {
      document.cookie = "googtrans=/vi/vi; path=/;";
      document.cookie = `googtrans=/vi/vi; path=/; domain=${domain};`;
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
    }

    // Try live combo switch if ready
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = targetLang;
      combo.dispatchEvent(new Event('change'));
      if (window.toast) {
        window.toast.info(targetLang === 'en' ? 'Translated page to English' : 'Đã chuyển về Tiếng Việt');
      }
    } else {
      // Reload smoothly to apply translation cookie
      window.location.reload();
    }
  };

  // 6. Callback for Google Translate script
  window.googleTranslateElementInit = function() {
    new window.google.translate.TranslateElement({
      pageLanguage: 'vi',
      includedLanguages: 'en,vi',
      autoDisplay: false
    }, 'google_translate_element');

    // If initial preference is English and not yet translated, trigger combo
    if (currentLang === 'en') {
      setTimeout(() => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo && combo.value !== 'en') {
          combo.value = 'en';
          combo.dispatchEvent(new Event('change'));
        }
      }, 500);
    }
  };

  // 7. Load Google Translate script asynchronously
  const gtScript = document.createElement('script');
  gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  gtScript.async = true;
  document.head.appendChild(gtScript);

  // 8. Generate Language Pill HTML
  function createPillElement(isLightVariant = false) {
    const pill = document.createElement('div');
    pill.className = `np-lang-pill ${isLightVariant ? 'np-lang-pill-light' : ''}`;
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

  // 9. Auto-inject into page headers when DOM is ready
  function mountLanguageSwitcher() {
    // A. Into explicit container if present
    const explicitContainers = document.querySelectorAll('.lang-switcher-slot, #lang-switcher-container');
    if (explicitContainers.length > 0) {
      explicitContainers.forEach(container => {
        container.innerHTML = '';
        container.appendChild(createPillElement(container.classList.contains('light')));
      });
      return;
    }

    // B. Public Header Top Utility Bar (next to Theme Toggle)
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn && themeBtn.parentNode) {
      const pill = createPillElement(false);
      themeBtn.parentNode.insertBefore(pill, themeBtn);
      return;
    }

    // C. Admin Header Bar (next to notification or cache dropdown)
    const adminNav = document.querySelector('header .flex.items-center.gap-3');
    if (adminNav) {
      const pill = createPillElement(true);
      adminNav.insertBefore(pill, adminNav.firstChild);
      return;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLanguageSwitcher);
  } else {
    mountLanguageSwitcher();
  }
})();
