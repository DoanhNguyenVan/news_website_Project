/**
 * NewsPortal Language Switcher (Tạm thời ẩn theo yêu cầu để nghiên cứu thêm)
 * Tự động dọn dẹp sạch sẽ cookie googtrans, không tải script Google Translate và ẩn hoàn toàn nút chuyển ngôn ngữ.
 */
(function() {
  'use strict';
  try {
    // 1. Xóa sạch mọi cookie dịch thuật còn lưu trong trình duyệt
    const hostname = window.location.hostname;
    const past = 'Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = `googtrans=; expires=${past}; path=/;`;
    document.cookie = `googtrans=/vi/vi; expires=${past}; path=/;`;
    if (hostname && hostname !== 'localhost') {
      document.cookie = `googtrans=; expires=${past}; path=/; domain=.${hostname};`;
      document.cookie = `googtrans=; expires=${past}; path=/; domain=${hostname};`;
    }
    localStorage.removeItem('newsportal_lang');

    // 2. Xóa các phần tử banner và pill nút chuyển nếu có
    const el = document.getElementById('google_translate_element');
    if (el) el.remove();
    document.querySelectorAll('.np-lang-pill, .goog-te-banner-frame, iframe.goog-te-banner-frame').forEach(b => b.remove());
    if (document.body && document.body.style.top) {
      document.body.style.top = '0px';
    }
  } catch (e) {
    // Safe
  }
})();
