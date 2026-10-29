/**
 * AUTH & HEADER STATE MANAGEMENT SYSTEM (auth-state.js)
 * Kiểm tra JWT Token, Phân quyền RBAC Header và Route Guard cho Admin
 */

function updateHeaderCurrentDate() {
  const elements = document.querySelectorAll('#current-date-display, .current-date-display');
  if (!elements || elements.length === 0) return;

  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const formattedDate = `${dayName}, ${date} Tháng ${month}, ${year}`;
  elements.forEach(el => {
    el.textContent = formattedDate;
  });
}

function initHeaderAndAuthState() {
  updateHeaderCurrentDate();
  renderHeaderAuth();
  enforceRouteGuard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderAndAuthState);
} else {
  initHeaderAndAuthState();
}

function getAuthData() {
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error("Lỗi parse user data", e);
    }
  }
  return { token, user };
}

function logoutUser() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

/**
 * YÊU CẦU 1: Điều khiển Ẩn/Hiện nút trên Header theo trạng thái Đăng nhập & Role
 */
function renderHeaderAuth() {
  const container = document.getElementById('header-auth-container');
  if (!container) return;

  const { token, user } = getAuthData();

  // TH1: Chưa đăng nhập (Độc giả vãng lai) -> Hiển thị nút "Đăng nhập / Đăng ký"
  if (!token || !user) {
    container.innerHTML = `
      <button onclick="openAuthModal('login')" class="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm">
        <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
        <span>Đăng nhập / Đăng ký</span>
      </button>
    `;
    return;
  }

  const role = user.role ? user.role.toUpperCase() : 'USER';
  const isAdminRole = ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'].includes(role);

  // TH2: Đã đăng nhập
  container.innerHTML = `
    <div class="flex items-center gap-3">
      ${isAdminRole ? `
        <a href="admin.html" class="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm">
          <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span>Trang Quản trị (CMS)</span>
        </a>
      ` : ''}
      <a href="user.html" class="user-pill-badge flex items-center gap-2 px-3 py-1 rounded-full shadow-xs hover:ring-2 hover:ring-blue-400 transition" title="Trang cá nhân & Quản lý bài lưu">
        <div class="w-6 h-6 bg-blue-600 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
          ${user.avatarUrl ? `<img src="${user.avatarUrl}" alt="Avatar" class="w-full h-full object-cover">` : (user.fullName || user.username ? (user.fullName || user.username).charAt(0).toUpperCase() : 'U')}
        </div>
        <span class="user-name-text text-xs font-semibold max-w-[120px] truncate">${user.fullName || user.username}</span>
      </a>
      <button onclick="logoutUser()" class="logout-btn p-1 transition-colors ml-0.5 rounded-full flex items-center justify-center cursor-pointer" title="Đăng xuất">
        <svg class="logout-icon-svg w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.4 7.4L2.8 12l4.6 4.6 1.4-1.4-2.2-2.2H14v-2H6.6l2.2-2.2z"/>
          <path d="M7 4h8c1.1 0 2 .9 2 2v1h-2V6H7v2.5H5V6c0-1.1.9-2 2-2z"/>
          <path d="M7 20h8c1.1 0 2-.9 2-2v-1h-2v1H7v-2.5H5V18c0 1.1.9 2 2 2z"/>
          <polygon points="15,3 21.5,5.5 21.5,18.5 15,21"/>
        </svg>
      </button>
    </div>
  `;
}

/**
 * YÊU CẦU 2: Route Guard - Độc giả vãng lai gõ trực tiếp URL admin.html sẽ bị đẩy về trang Đăng nhập
 */
function enforceRouteGuard() {
  const path = window.location.pathname;
  if (path.includes('admin.html')) {
    const { token, user } = getAuthData();
    if (!token || !user) {
      alert("Bạn chưa đăng nhập. Vui lòng đăng nhập tài khoản Quản trị để tiếp tục!");
      window.location.href = 'index.html?auth=login';
      return;
    }

    const role = user.role ? user.role.toUpperCase() : 'USER';
    const isAdminRole = ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'].includes(role);
    if (!isAdminRole) {
      alert("Tài khoản độc giả không có quyền truy cập Trang Quản trị CMS!");
      window.location.href = 'index.html';
    }
  }

  if (path.includes('user.html')) {
    const { token } = getAuthData();
    if (!token) {
      alert("Vui lòng đăng nhập để truy cập trang cá nhân và bài viết đã lưu!");
      window.location.href = 'index.html?auth=login';
    }
  }
}
