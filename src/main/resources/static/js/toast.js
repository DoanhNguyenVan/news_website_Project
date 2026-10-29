/**
 * NewsPortal Modern Toast & Notification System
 * Replaces ugly browser alert() with sleek, animated, accessible editorial toasts
 */
(function() {
  'use strict';

  // 1. Inject Styles for Toast & Confirm Modal
  const styles = document.createElement('style');
  styles.id = 'newsportal-toast-styles';
  styles.textContent = `
    #newsportal-toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: calc(100vw - 2.5rem);
      width: 23rem;
      pointer-events: none;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    @media (max-width: 640px) {
      #newsportal-toast-container {
        top: 0.75rem;
        right: 0.75rem;
        left: 0.75rem;
        width: auto;
      }
    }
    .np-toast {
      pointer-events: auto;
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 0.95rem 1.15rem;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 1rem;
      box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.05);
      overflow: hidden;
      transform: translateX(110%);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      cursor: default;
    }
    .dark .np-toast {
      background: #1E293B;
      border-color: #334155;
      box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.4);
    }
    .np-toast.np-toast-visible {
      transform: translateX(0);
      opacity: 1;
    }
    .np-toast.np-toast-hiding {
      transform: translateX(110%);
      opacity: 0;
    }
    .np-toast-icon {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .np-toast-content {
      flex: 1;
      min-width: 0;
      padding-top: 0.1rem;
    }
    .np-toast-title {
      font-size: 0.8125rem;
      font-weight: 700;
      line-height: 1.25;
      margin-bottom: 0.2rem;
      color: #0F172A;
    }
    .dark .np-toast-title {
      color: #F8FAFC;
    }
    .np-toast-message {
      font-size: 0.8125rem;
      color: #475569;
      line-height: 1.45;
      word-break: break-word;
    }
    .dark .np-toast-message {
      color: #94A3B8;
    }
    .np-toast-close {
      background: transparent;
      border: none;
      color: #94A3B8;
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease, background-color 0.15s ease;
      margin-top: -0.15rem;
      margin-right: -0.35rem;
    }
    .np-toast-close:hover {
      color: #0F172A;
      background: #F1F5F9;
    }
    .dark .np-toast-close:hover {
      color: #F8FAFC;
      background: #334155;
    }
    .np-toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      transform-origin: left;
    }

    /* Variant Colors */
    .np-toast-success .np-toast-icon {
      background: #ECFDF5;
      color: #059669;
    }
    .dark .np-toast-success .np-toast-icon {
      background: rgba(5, 150, 105, 0.2);
      color: #34D399;
    }
    .np-toast-success .np-toast-progress {
      background: #10B981;
    }
    .np-toast-success {
      border-left: 4px solid #10B981;
    }

    .np-toast-error .np-toast-icon {
      background: #FEF2F2;
      color: #DC2626;
    }
    .dark .np-toast-error .np-toast-icon {
      background: rgba(220, 38, 38, 0.2);
      color: #F87171;
    }
    .np-toast-error .np-toast-progress {
      background: #EF4444;
    }
    .np-toast-error {
      border-left: 4px solid #EF4444;
    }

    .np-toast-warning .np-toast-icon {
      background: #FFFBEB;
      color: #D97706;
    }
    .dark .np-toast-warning .np-toast-icon {
      background: rgba(217, 119, 6, 0.2);
      color: #FBBF24;
    }
    .np-toast-warning .np-toast-progress {
      background: #F59E0B;
    }
    .np-toast-warning {
      border-left: 4px solid #F59E0B;
    }

    .np-toast-info .np-toast-icon {
      background: #EFF6FF;
      color: #2563EB;
    }
    .dark .np-toast-info .np-toast-icon {
      background: rgba(37, 99, 235, 0.2);
      color: #60A5FA;
    }
    .np-toast-info .np-toast-progress {
      background: #3B82F6;
    }
    .np-toast-info {
      border-left: 4px solid #3B82F6;
    }

    /* Modal Backdrop for Modern Confirm */
    .np-confirm-backdrop {
      position: fixed;
      inset: 0;
      z-index: 999998;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }
    .np-confirm-backdrop.np-confirm-visible {
      opacity: 1;
    }
    .np-confirm-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 1.25rem;
      max-width: 26rem;
      width: 100%;
      padding: 1.5rem;
      box-shadow: 0 20px 35px -8px rgba(15, 23, 42, 0.2);
      transform: scale(0.94);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dark .np-confirm-card {
      background: #1E293B;
      border-color: #334155;
      color: #F8FAFC;
    }
    .np-confirm-backdrop.np-confirm-visible .np-confirm-card {
      transform: scale(1);
    }
  `;
  document.head.appendChild(styles);

  // 2. Ensure Toast Container exists
  function getContainer() {
    let container = document.getElementById('newsportal-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'newsportal-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  // Icons SVG
  const ICONS = {
    success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
    warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    close: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`
  };

  const DEFAULT_TITLES = {
    success: 'Thành công',
    error: 'Đã có lỗi xảy ra',
    warning: 'Chú ý',
    info: 'Thông báo'
  };

  /**
   * Main Toast function
   */
  function showToast(message, type = 'info', title = null, duration = 3800) {
    if (!message) return;

    const validTypes = ['success', 'error', 'warning', 'info'];
    if (!validTypes.includes(type)) type = 'info';

    const toastTitle = title || DEFAULT_TITLES[type];
    const container = getContainer();

    const toast = document.createElement('div');
    toast.className = `np-toast np-toast-${type}`;

    toast.innerHTML = `
      <div class="np-toast-icon">
        ${ICONS[type]}
      </div>
      <div class="np-toast-content">
        <div class="np-toast-title">${toastTitle}</div>
        <div class="np-toast-message">${message}</div>
      </div>
      <button class="np-toast-close" title="Đóng">
        ${ICONS.close}
      </button>
      <div class="np-toast-progress"></div>
    `;

    container.appendChild(toast);

    // Animation trigger
    requestAnimationFrame(() => {
      toast.classList.add('np-toast-visible');
    });

    const progressBar = toast.querySelector('.np-toast-progress');
    let startTime = Date.now();
    let remaining = duration;
    let timerId = null;
    let animFrameId = null;

    function updateProgress() {
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 1 - (elapsed / duration));
      if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
      if (progress > 0) {
        animFrameId = requestAnimationFrame(updateProgress);
      }
    }

    function hideToast() {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (timerId) clearTimeout(timerId);
      toast.classList.remove('np-toast-visible');
      toast.classList.add('np-toast-hiding');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }

    timerId = setTimeout(hideToast, duration);
    animFrameId = requestAnimationFrame(updateProgress);

    // Close button
    toast.querySelector('.np-toast-close').addEventListener('click', hideToast);

    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(timerId);
      cancelAnimationFrame(animFrameId);
    });
    toast.addEventListener('mouseleave', () => {
      timerId = setTimeout(hideToast, 1500);
    });

    return toast;
  }

  /**
   * Smart auto-detect toast type based on text content
   */
  function autoToast(message) {
    if (typeof message !== 'string') {
      message = String(message);
    }
    const lower = message.toLowerCase();

    // Check for success keywords
    if (lower.includes('thành công') || lower.includes('đã lưu') || lower.includes('đã duyệt') || 
        lower.includes('đã xóa') || lower.includes('hoàn tất') || lower.includes('xuất bản') || lower.includes('thành công')) {
      return showToast(message, 'success', 'Thành công');
    }
    // Check for error keywords
    if (lower.includes('lỗi') || lower.includes('thất bại') || lower.includes('sai') || 
        lower.includes('không chính xác') || lower.includes('từ chối') || lower.includes('hết hạn') || lower.includes('không thể')) {
      return showToast(message, 'error', 'Thao tác không thành công');
    }
    // Check for warning keywords
    if (lower.includes('cảnh báo') || lower.includes('vui lòng') || lower.includes('chú ý') || 
        lower.includes('yêu cầu') || lower.includes('chưa')) {
      return showToast(message, 'warning', 'Lưu ý');
    }

    return showToast(message, 'info', 'Thông báo');
  }

  // Toast API object
  const toast = {
    show: showToast,
    auto: autoToast,
    success: (msg, title) => showToast(msg, 'success', title),
    error: (msg, title) => showToast(msg, 'error', title),
    warning: (msg, title) => showToast(msg, 'warning', title),
    info: (msg, title) => showToast(msg, 'info', title)
  };

  window.toast = toast;
  window.showToast = showToast;

  // OVERRIDE default browser window.alert() seamlessly
  window.alert = function(msg) {
    autoToast(msg);
  };

  console.log('[NewsPortal] Modern Toast & Alert Notification System initialized.');
})();

