/**
 * NewsPortal 1-Click Instant Language Switcher (Tiếng Việt 🇻🇳 / English 🇬🇧)
 * Seamlessly translates entire website including articles, titles, menus, and comments.
 * 100% hides the default Google Translate top banner bar and prevents body displacement.
 */
(function() {
  'use strict';

  // 1. Inject CSS for language switch pill and permanently hide Google Translate toolbar/banner
  const style = document.createElement('style');
  style.id = 'newsportal-lang-styles';
  style.textContent = `
    /* Permanent strict hide for all Google Translate banners, iframes & tooltips */
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

  // 2. Active enforcement against Google Translate pushing body down
  function cleanGoogleBanner() {
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

  // Monitor DOM mutations to instantly kill any banner Google attempts to render
  const observer = new MutationObserver(cleanGoogleBanner);
  observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
  setInterval(cleanGoogleBanner, 250);

  // 3. Hidden container for Google Translate Element
  const gtDiv = document.createElement('div');
  gtDiv.id = 'google_translate_element';
  document.body.appendChild(gtDiv);

  // 4. Current active language
  let currentLang = localStorage.getItem('newsportal_lang') || 'vi';
  if (document.cookie.includes('googtrans=/vi/en') || document.cookie.includes('googtrans=/auto/en')) {
    currentLang = 'en';
  } else {
    currentLang = 'vi';
  }

  // 5. Update UI Buttons
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

  // 6. Global function to switch language
  window.switchNewsPortalLang = function(targetLang) {
    const hostname = window.location.hostname;

    if (targetLang === 'vi') {
      // Revert back to original Vietnamese
      localStorage.setItem('newsportal_lang', 'vi');
      currentLang = 'vi';
      updatePillButtons('vi');

      // Erase translation cookies thoroughly
      const domains = [hostname, '.' + hostname, ''];
      const paths = ['/', '/api', ''];
      domains.forEach(d => {
        paths.forEach(p => {
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${p}; domain=${d};`;
          document.cookie = `googtrans=/vi/vi; path=${p}; domain=${d};`;
        });
      });

      // Reload smoothly to restore 100% original Vietnamese text
      window.location.reload();
      return;
    }

    if (targetLang === 'en') {
      // Translate to English
      localStorage.setItem('newsportal_lang', 'en');
      currentLang = 'en';
      updatePillButtons('en');

      document.cookie = `googtrans=/vi/en; path=/; domain=${hostname};`;
      document.cookie = `googtrans=/vi/en; path=/;`;

      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = 'en';
        combo.dispatchEvent(new Event('change'));
        cleanGoogleBanner();
      } else {
        window.location.reload();
      }
    }
  };

  // 7. Callback for Google Translate script
  window.googleTranslateElementInit = function() {
    new window.google.translate.TranslateElement({
      pageLanguage: 'vi',
      includedLanguages: 'en,vi',
      autoDisplay: false
    }, 'google_translate_element');

    cleanGoogleBanner();

    // If preference is English, ensure combo activates
    if (currentLang === 'en') {
      setTimeout(() => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo && combo.value !== 'en') {
          combo.value = 'en';
          combo.dispatchEvent(new Event('change'));
        }
        cleanGoogleBanner();
      }, 500);
    }
  };

  // 8. Load Google Translate script asynchronously
  const gtScript = document.createElement('script');
  gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  gtScript.async = true;
  document.head.appendChild(gtScript);

  // 9. Generate Language Pill HTML
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

  // 10. Auto-inject into page headers when DOM is ready
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
