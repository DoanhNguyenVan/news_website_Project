/**
 * CMS ADMIN CONTROLLER & INTERACTION SYSTEM (admin.js)
 * Quản trị tòa soạn toàn diện: Luồng sáng tác 75/25, RBAC Matrix, Real-time Notifications, DAM Gallery, Flush Cache.
 */

let currentPostStatus = 'ALL';
let currentCommentStatus = 'ALL';
let allCategoriesList = [];
let autoSaveInterval = null;
let currentDraftHistory = [];
const EYE_ICON_SVG = `<svg class="eye-icon-svg inline-block shrink-0" viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-7.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/></svg>`;

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
  setupKeyboardShortcuts();
  setupAutoSaveTimer();
});

/* ========================================================
 * 1. KHỞI TẠO & KIỂM TRA QUYỀN TRUY CẬP (AUTHENTICATION & ROLES)
 * ======================================================== */
async function initAdminDashboard() {
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  let user = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error("Lỗi parse user", e);
    }
  }

  // Nếu chưa có token -> Hiển thị Modal Đăng nhập Admin
  if (!token) {
    showLoginModal();
    return;
  }

  // Xác thực token và lấy profile sạch từ Server
  try {
    const meData = await ApiService.getMe();
    if (meData && meData.role) {
      user = {
        id: meData.id,
        username: meData.username,
        email: meData.email,
        role: meData.role,
        fullName: meData.fullName
      };
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch (e) {
    console.warn("Lỗi kiểm tra session /auth/me:", e);
  }

  if (!user) {
    showLoginModal();
    return;
  }

  const role = (user.role || '').toUpperCase();
  const allowedRoles = ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'];

  // Chặn hoàn toàn độc giả thông thường (USER) hoặc vai trò không hợp lệ
  if (!allowedRoles.includes(role)) {
    alert("Tài khoản độc giả không có quyền truy cập Trang Quản Trị CMS! Hệ thống đang chuyển hướng về Trang chủ.");
    window.location.href = 'index.html';
    return;
  }

  // Áp dụng ẩn/hiện các thành phần giao diện theo ma trận phân quyền
  applyRolePermissions(role);

  // Cập nhật thông tin Header
  const avatarEl = document.getElementById('header-user-avatar');
  const nameEl = document.getElementById('header-user-name');
  const emailEl = document.getElementById('header-user-email');
  const badgeEl = document.getElementById('role-badge');

  if (avatarEl) avatarEl.innerText = (user.username || 'A').charAt(0).toUpperCase();
  if (nameEl) nameEl.innerText = user.fullName || user.username || 'Admin System';
  if (emailEl) emailEl.innerText = user.email || 'admin@newsportal.com';
  if (badgeEl) {
    badgeEl.innerText = getRoleTitle(role);
    badgeEl.className = getRoleBadgeClass(role);
  }

  // Khởi tạo các nút action theo Role
  renderFormActionButtons();

  // Load danh mục & notifications
  await loadCategoriesDropdown();
  loadRealtimeNotifications();

  // Load dữ liệu Dashboard đầu tiên
  loadDashboardData();
}

/**
 * Quét toàn bộ DOM và ẩn các thành phần không đủ thẩm quyền dựa trên attribute data-role-required
 */
function applyRolePermissions(userRole) {
  const role = (userRole || getUserRole()).toUpperCase();
  const elements = document.querySelectorAll('[data-role-required]');
  elements.forEach(el => {
    const requiredStr = el.getAttribute('data-role-required') || '';
    const requiredRoles = requiredStr.split(',').map(r => r.trim().toUpperCase());
    if (requiredRoles.includes(role)) {
      el.classList.remove('hidden');
      if (el.style.display === 'none') {
        el.style.display = '';
      }
    } else {
      el.classList.add('hidden');
    }
  });
}

function getUserRole() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return 'USER';
  try {
    const user = JSON.parse(userStr);
    return (user.role || 'USER').toUpperCase();
  } catch (e) {
    return 'USER';
  }
}

function getRoleTitle(roleStr) {
  const r = (roleStr || '').toUpperCase();
  switch (r) {
    case 'SUPER_ADMIN': return 'Quản Trị Hệ Thống (SUPER_ADMIN)';
    case 'EDITOR_IN_CHIEF': return 'Tổng Biên Tập (EDITOR_IN_CHIEF)';
    case 'EDITOR': return 'Biên Tập Viên (EDITOR)';
    case 'AUTHOR': return 'Tác Giả / Phóng Viên (AUTHOR)';
    default: return 'Độc Giả (USER)';
  }
}

function getRoleBadgeClass(roleStr) {
  const r = (roleStr || '').toUpperCase();
  switch (r) {
    case 'SUPER_ADMIN':
      return 'px-2.5 py-0.5 text-xs font-extrabold bg-purple-100 text-purple-700 rounded-full border border-purple-200 uppercase';
    case 'EDITOR_IN_CHIEF':
      return 'px-2.5 py-0.5 text-xs font-extrabold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 uppercase';
    case 'EDITOR':
      return 'px-2.5 py-0.5 text-xs font-extrabold bg-blue-100 text-blue-700 rounded-full border border-blue-200 uppercase';
    case 'AUTHOR':
      return 'px-2.5 py-0.5 text-xs font-extrabold bg-teal-100 text-teal-700 rounded-full border border-teal-200 uppercase';
    default:
      return 'px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200 uppercase';
  }
}

function showLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.classList.remove('hidden');
}

function hideLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleQuickAdminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('quick-login-user').value.trim();
  const password = document.getElementById('quick-login-pass').value.trim();
  const errorBox = document.getElementById('admin-login-error');

  errorBox.classList.add('hidden');

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const json = await res.json();

    if (json.success && json.data) {
      localStorage.setItem('accessToken', json.data.accessToken);
      localStorage.setItem('refreshToken', json.data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        id: json.data.id,
        username: json.data.username,
        email: json.data.email,
        role: json.data.role,
        fullName: json.data.fullName
      }));

      hideLoginModal();
      initAdminDashboard();
    } else {
      errorBox.innerText = json.message || "Tên đăng nhập hoặc mật khẩu không chính xác!";
      errorBox.classList.remove('hidden');
    }
  } catch (err) {
    errorBox.innerText = "Lỗi kết nối tới máy chủ!";
    errorBox.classList.remove('hidden');
  }
}

function logoutAdmin() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

/* ========================================================
 * 2. ĐIỀU HƯỚNG TABS GIAO DIỆN (TAB SWITCHING & RBAC ENFORCEMENT)
 * ======================================================== */
const TAB_ROLE_MATRIX = {
  dashboard: ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'],
  posts: ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'],
  categories: ['SUPER_ADMIN', 'EDITOR_IN_CHIEF'],
  users: ['SUPER_ADMIN'],
  comments: ['SUPER_ADMIN'],
  media: ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'],
  advertisements: ['SUPER_ADMIN', 'EDITOR_IN_CHIEF'],
  polls: ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR'],
  settings: ['SUPER_ADMIN']
};

function toggleAdminSidebar(show) {
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  if (!sidebar) return;
  const isHidden = sidebar.classList.contains('-translate-x-full');
  const shouldOpen = show !== undefined ? show : isHidden;
  if (shouldOpen) {
    sidebar.classList.remove('-translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}
window.toggleAdminSidebar = toggleAdminSidebar;

function switchTab(tabName) {
  // Tự động đóng sidebar trên mobile khi chuyển tab để người dùng xem ngay nội dung
  if (window.innerWidth < 768) {
    toggleAdminSidebar(false);
  }

  const role = getUserRole();
  const allowed = TAB_ROLE_MATRIX[tabName];

  if (allowed && !allowed.includes(role)) {
    alert(`Bạn không có quyền truy cập vào mục này (Yêu cầu vai trò: ${allowed.join(', ')})!`);
    return;
  }

  // Cập nhật Sidebar Nav Active
  const navButtons = document.querySelectorAll('#admin-sidebar-nav button');
  navButtons.forEach(btn => btn.classList.remove('nav-active'));

  const activeBtn = document.getElementById(`nav-${tabName}`);
  if (activeBtn) activeBtn.classList.add('nav-active');

  // Ẩn tất cả các Section
  const sections = ['dashboard', 'posts', 'categories', 'users', 'comments', 'media', 'advertisements', 'polls', 'settings'];
  sections.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.classList.add('hidden');
  });

  // Hiện Section tương ứng
  const targetSection = document.getElementById(`section-${tabName}`);
  if (targetSection) targetSection.classList.remove('hidden');

  // Cập nhật Heading
  const headingEl = document.getElementById('page-heading');
  const headings = {
    dashboard: 'Dashboard',
    posts: 'Quản Lý Bài Viết',
    categories: 'Quản Lý Chuyên Mục',
    users: 'Người Dùng & Phân Quyền',
    comments: 'Quản Lý Bình Luận',
    media: 'Thư Viện Media DAM',
    advertisements: 'Quảng Cáo & Banner',
    polls: 'Thăm Dò Ý Kiến (Polls)',
    settings: 'Cài Đặt & Bộ Nhớ Cache'
  };
  if (headingEl) headingEl.innerText = headings[tabName] || 'CMS Admin';

  // Nạp dữ liệu của Tab đó
  if (tabName === 'dashboard') loadDashboardData();
  else if (tabName === 'posts') loadPostsTable();
  else if (tabName === 'categories') loadCategoriesTable();
  else if (tabName === 'users') loadUsersTable();
  else if (tabName === 'comments') loadCommentsTable();
  else if (tabName === 'media') loadDAMGallery();
  else if (tabName === 'advertisements') loadAdvertisementsTable();
  else if (tabName === 'polls') loadPollsTable();
}

/* ========================================================
 * 3. DASHBOARD STATS & ANALYTICS WIDGETS
 * ======================================================== */
let postStatusChartInstance = null;
let topArticlesChartInstance = null;
let globalSearchKeyword = '';

function initDashboardCharts(stats, topPosts = []) {
  if (typeof Chart === 'undefined') return;

  // 1. Doughnut Chart for Real Post Status Distribution
  const ctxStatus = document.getElementById('postStatusDoughnut');
  if (ctxStatus && stats) {
    if (postStatusChartInstance) postStatusChartInstance.destroy();
    const published = Number(stats.publishedPosts || 0);
    const pending = Number(stats.pendingPosts || 0);
    const total = Number(stats.totalPosts || 0);
    const drafts = Math.max(0, total - published - pending);

    postStatusChartInstance = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Đã xuất bản', 'Chờ phê duyệt', 'Bản nháp / Đang soạn'],
        datasets: [{
          data: [published, pending, drafts],
          backgroundColor: ['#2563EB', '#F59E0B', '#94A3B8'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: { size: 11, weight: '600' },
              color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} bài viết`
            }
          }
        }
      }
    });
  }

  // 2. Bar Chart for Real Top Articles Views
  const ctxTop = document.getElementById('topArticlesBarChart');
  if (ctxTop && Array.isArray(topPosts) && topPosts.length > 0) {
    if (topArticlesChartInstance) topArticlesChartInstance.destroy();
    const labels = topPosts.map(p => (p.title && p.title.length > 18 ? p.title.substring(0, 18) + '...' : (p.title || 'Bài viết')));
    const dataViews = topPosts.map(p => Number(p.viewsCount || 0));

    topArticlesChartInstance = new Chart(ctxTop, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Lượt xem',
          data: dataViews,
          backgroundColor: '#2563EB',
          hoverBackgroundColor: '#1D4ED8',
          borderRadius: 6,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                return topPosts[idx]?.title || '';
              },
              label: (ctx) => ` ${Number(ctx.raw || 0).toLocaleString()} lượt xem`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { size: 10 } }
          },
          y: {
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#64748B',
              font: { size: 11 },
              callback: (v) => (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v)
            }
          }
        }
      }
    });
  }
}

async function loadDashboardData() {
  try {
    const stats = await ApiService.getAdminStats();
    if (stats) {
      document.getElementById('stat-total-posts').innerText = stats.totalPosts || 0;
      document.getElementById('stat-pending-posts').innerText = stats.pendingPosts || 0;
      document.getElementById('stat-published-posts').innerText = stats.publishedPosts || 0;
      const subPub = document.getElementById('stat-published-posts-sub');
      if (subPub) subPub.innerText = (stats.publishedPosts || 0) + ' bài';
      document.getElementById('stat-total-views').innerText = Number(stats.totalViews || 0).toLocaleString();
      document.getElementById('stat-total-users').innerText = stats.totalUsers || 0;
      document.getElementById('stat-total-categories').innerText = stats.totalCategories || 0;
      const pendComm = document.getElementById('stat-pending-comments');
      if (pendComm) pendComm.innerText = stats.pendingComments || 0;
    }
    const topPosts = await loadDashboardTopArticles();
    if (getUserRole() === 'SUPER_ADMIN') {
      loadDashboardReporterStats();
    }
    setTimeout(() => initDashboardCharts(stats, topPosts), 100);
  } catch (err) {
    console.error("Lỗi nạp thống kê dashboard:", err);
  }
}

async function loadDashboardTopArticles() {
  const container = document.getElementById('dashboard-top-articles-list');
  if (!container) return [];

  try {
    let posts = await ApiService.getPosts({ size: 5, sort: 'views' });
    if (!posts || posts.length === 0) {
      const adminPosts = await ApiService.getAdminPosts('PUBLISHED', 0, 10);
      if (adminPosts && Array.isArray(adminPosts)) {
        posts = [...adminPosts].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)).slice(0, 5);
      }
    }

    if (!posts || posts.length === 0) {
      container.innerHTML = `<div class="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu bài viết xem nhiều.</div>`;
      return [];
    }

    container.innerHTML = posts.map((p, idx) => `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs border border-slate-100">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-5 h-5 rounded-full ${idx === 0 ? 'bg-amber-500 text-white font-black' : 'bg-slate-200 text-slate-700 font-bold'} flex items-center justify-center text-[10px] shrink-0">${idx + 1}</span>
          <span class="font-bold text-slate-800 truncate cursor-pointer hover:text-blue-600" onclick="window.open('article-detail.html?slug=${p.slug}', '_blank')">${p.title}</span>
        </div>
        <span class="font-mono text-blue-600 font-extrabold ml-3 shrink-0 inline-flex items-center gap-1">${EYE_ICON_SVG} <span>${Number(p.viewsCount || 0).toLocaleString()} views</span></span>
      </div>
    `).join('');

    return posts;
  } catch (err) {
    console.error("Lỗi nạp top bài viết:", err);
    container.innerHTML = `<div class="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu bài viết.</div>`;
    return [];
  }
}

async function loadDashboardReporterStats() {
  const container = document.getElementById('dashboard-reporter-stats-list');
  if (!container) return;
  if (getUserRole() !== 'SUPER_ADMIN') {
    const card = container.closest('.saas-card');
    if (card) card.classList.add('hidden');
    return;
  }

  try {
    const users = await ApiService.getUsers();
    if (Array.isArray(users) && users.length > 0) {
      const staff = users.filter(u => ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'].includes(u.role)).slice(0, 5);
      if (staff.length > 0) {
        container.innerHTML = staff.map(u => {
          let roleBadge = 'bg-blue-100 text-blue-700';
          let roleName = u.role;
          if (u.role === 'SUPER_ADMIN') { roleBadge = 'bg-purple-100 text-purple-700'; roleName = 'Quản trị viên'; }
          else if (u.role === 'EDITOR_IN_CHIEF') { roleBadge = 'bg-indigo-100 text-indigo-700'; roleName = 'Tổng biên tập'; }
          else if (u.role === 'EDITOR') { roleBadge = 'bg-blue-100 text-blue-700'; roleName = 'Biên tập viên'; }
          else if (u.role === 'AUTHOR') { roleBadge = 'bg-emerald-100 text-emerald-700'; roleName = 'Phóng viên'; }

          return `
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs border border-slate-100">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  ${(u.username || 'U')[0].toUpperCase()}
                </div>
                <div class="truncate">
                  <div class="font-bold text-slate-800 truncate">${u.fullName || u.username}</div>
                  <div class="text-[10px] text-slate-400 truncate">${u.email || ''}</div>
                </div>
              </div>
              <span class="px-2 py-0.5 ${roleBadge} rounded-full font-bold text-[10px] shrink-0">${roleName}</span>
            </div>
          `;
        }).join('');
        return;
      }
    }
  } catch (e) {
    // Non-admin role might not have /users permission
  }

  container.innerHTML = `<div class="text-xs text-slate-400 py-4 text-center">Đang cập nhật danh sách nhân sự toà soạn.</div>`;
}

/* ========================================================
 * 4. REAL-TIME NOTIFICATION CENTER
 * ======================================================== */
function toggleNotificationMenu() {
  const menu = document.getElementById('notif-menu');
  if (menu) menu.classList.toggle('hidden');
}

async function loadRealtimeNotifications() {
  const container = document.getElementById('notif-list-container');
  const badge = document.getElementById('notif-badge-count');
  if (!container) return;

  try {
    const pendingPosts = await ApiService.getAdminPosts('PENDING_APPROVAL', 0, 10);
    const count = Array.isArray(pendingPosts) ? pendingPosts.length : 0;
    if (badge) {
      badge.innerText = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    if (!pendingPosts || count === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-xs text-slate-400">
          <svg class="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Không có bài viết nào chờ phê duyệt. Toàn bộ tin bài đã được xử lý.
        </div>
      `;
      return;
    }

    container.innerHTML = pendingPosts.slice(0, 5).map(p => `
      <div class="p-3 hover:bg-blue-50/50 transition cursor-pointer flex gap-2.5 items-start border-b border-slate-100 last:border-b-0" onclick="switchTab('posts'); currentPostStatus='PENDING_APPROVAL'; loadPostsTable(); toggleNotificationMenu();">
        <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        <div class="flex-1 min-w-0">
          <p class="text-slate-800 font-medium text-xs leading-snug line-clamp-2">${p.title}</p>
          <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
            <span class="font-semibold text-blue-600">${p.authorName || 'Tác giả'}</span>
            <span>•</span>
            <span>Chờ duyệt</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    if (badge) badge.style.display = 'none';
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">Không có thông báo mới.</div>`;
  }
}

function handleHeaderSearch(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const query = (e.target.value || '').trim();
    globalSearchKeyword = query;
    switchTab('posts');
    loadPostsTable(query);
  }
}

function markAllNotificationsRead() {
  const badge = document.getElementById('notif-badge-count');
  if (badge) badge.innerText = '0';
  toggleNotificationMenu();
}

/* ========================================================
 * 5. ADVANCED CACHE MANAGER DROPDOWNS
 * ======================================================== */
function toggleSidebarCacheMenu() {
  const menu = document.getElementById('sidebar-cache-menu');
  if (menu) menu.classList.toggle('hidden');
}

function toggleHeaderCacheMenu() {
  const menu = document.getElementById('header-cache-menu');
  if (menu) menu.classList.toggle('hidden');
}

function toggleCacheDropdown() {
  toggleSidebarCacheMenu();
}

async function handleQuickClearCache(type = 'all') {
  try {
    await ApiService.clearCache();
    let typeText = 'Toàn bộ';
    if (type === 'home') typeText = 'Trang chủ';
    if (type === 'category') typeText = 'Chuyên mục';
    alert(`Đã xóa sạch Cache ${typeText} thành công! Backend đang tự động tái tạo Cache từ Database.`);
    
    // Hide menus if open
    const m1 = document.getElementById('sidebar-cache-menu');
    const m2 = document.getElementById('header-cache-menu');
    if (m1) m1.classList.add('hidden');
    if (m2) m2.classList.add('hidden');
    
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi xóa cache!");
  }
}

async function handleClearAllCache() {
  await handleQuickClearCache('all');
}

/* ========================================================
 * 6. EDITORIAL FORM & REAL-TIME COUNTERS (75/25 LAYOUT)
 * ======================================================== */
function updateEditorialCounters() {
  const titleInput = document.getElementById('form-post-title');
  const sapoInput = document.getElementById('form-post-sapo');
  const editorArea = document.getElementById('editor-content-area');

  // Title Counter
  const titleText = titleInput ? titleInput.value.trim() : '';
  const titleChars = titleText.length;
  const titleWords = titleText ? titleText.split(/\s+/).length : 0;

  const titleCharsEl = document.getElementById('counter-title-chars');
  const titleWordsEl = document.getElementById('counter-title-words');
  const titleGaugeEl = document.getElementById('gauge-title-seo');

  if (titleCharsEl) titleCharsEl.innerText = `${titleChars} ký tự`;
  if (titleWordsEl) titleWordsEl.innerText = `${titleWords} từ`;

  if (titleGaugeEl) {
    if (titleChars >= 50 && titleChars <= 70) {
      titleGaugeEl.className = 'px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded';
      titleGaugeEl.innerText = 'Tiêu đề chuẩn SEO (50-70 ký tự)';
    } else if (titleChars > 0 && titleChars < 50) {
      titleGaugeEl.className = 'px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded';
      titleGaugeEl.innerText = 'Hơi ngắn (Khuyên dùng 50-70)';
    } else if (titleChars > 70) {
      titleGaugeEl.className = 'px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded';
      titleGaugeEl.innerText = 'Quá dài (Khuyên dùng <70)';
    }
  }

  // Sapo Counter
  const sapoText = sapoInput ? sapoInput.value.trim() : '';
  const sapoChars = sapoText.length;
  const sapoWords = sapoText ? sapoText.split(/\s+/).length : 0;

  const sapoCharsEl = document.getElementById('counter-sapo-chars');
  const sapoWordsEl = document.getElementById('counter-sapo-words');
  const sapoGaugeEl = document.getElementById('gauge-sapo-seo');

  if (sapoCharsEl) sapoCharsEl.innerText = `${sapoChars} ký tự`;
  if (sapoWordsEl) sapoWordsEl.innerText = `${sapoWords} từ`;

  if (sapoGaugeEl) {
    if (sapoChars >= 120 && sapoChars <= 160) {
      sapoGaugeEl.className = 'px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded';
      sapoGaugeEl.innerText = 'Sapo chuẩn SEO (120-160 ký tự)';
    } else if (sapoChars > 0 && sapoChars < 120) {
      sapoGaugeEl.className = 'px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded';
      sapoGaugeEl.innerText = 'Hơi ngắn (Khuyên dùng 120-160)';
    } else if (sapoChars > 160) {
      sapoGaugeEl.className = 'px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded';
      sapoGaugeEl.innerText = 'Quá dài (Khuyên dùng <160)';
    }
  }

  // Editor Content Counter
  const editorText = editorArea ? editorArea.innerText.trim() : '';
  const editorWords = editorText ? editorText.split(/\s+/).length : 0;
  const editorWordsEl = document.getElementById('counter-editor-words');
  if (editorWordsEl) editorWordsEl.innerText = `${editorWords} từ trong bài viết`;
}

/* AUTO SAVE & VERSION HISTORY */
function setupAutoSaveTimer() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(() => {
    const formContainer = document.getElementById('post-form-container');
    if (formContainer && !formContainer.classList.contains('hidden')) {
      performAutoSaveDraft();
    }
  }, 30000); // 30 seconds
}

function performAutoSaveDraft() {
  const title = document.getElementById('form-post-title').value.trim();
  const sapo = document.getElementById('form-post-sapo').value.trim();
  const editorArea = document.getElementById('editor-content-area');
  const content = editorArea ? editorArea.innerHTML.trim() : '';

  if (!title && !content) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString();

  const snapshot = {
    timestamp: timeStr,
    title,
    sapo,
    content
  };

  currentDraftHistory.unshift(snapshot);
  if (currentDraftHistory.length > 5) currentDraftHistory.pop();

  localStorage.setItem('cms_latest_auto_draft', JSON.stringify(snapshot));

  const indicator = document.getElementById('autosave-status-indicator');
  if (indicator) {
    indicator.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Đã tự động lưu nháp lúc ${timeStr}`;
  }
}

function showVersionHistoryModal() {
  const modal = document.getElementById('modal-version-history');
  const container = document.getElementById('version-history-list');
  if (!modal || !container) return;

  modal.classList.remove('hidden');

  if (currentDraftHistory.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-slate-400">Chưa có lịch sử phiên bản nháp tự động nào.</div>`;
    return;
  }

  container.innerHTML = currentDraftHistory.map((item, idx) => `
    <div class="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex justify-between items-center">
      <div>
        <div class="font-bold text-slate-800">${item.title || '(Không tiêu đề)'}</div>
        <div class="text-[11px] text-slate-400">Lúc ${item.timestamp}</div>
      </div>
      <button type="button" onclick="restoreVersionHistory(${idx})" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow">
        Khôi phục
      </button>
    </div>
  `).join('');
}

function closeVersionHistoryModal() {
  const modal = document.getElementById('modal-version-history');
  if (modal) modal.classList.add('hidden');
}

function restoreVersionHistory(index) {
  const item = currentDraftHistory[index];
  if (!item) return;

  document.getElementById('form-post-title').value = item.title || '';
  document.getElementById('form-post-sapo').value = item.sapo || '';
  document.getElementById('editor-content-area').innerHTML = item.content || '';
  updateEditorialCounters();

  closeVersionHistoryModal();
  alert(`Đã khôi phục phiên bản nháp lúc ${item.timestamp}!`);
}

/* ========================================================
 * 7. JOURNALISTIC TOOLBAR HELPER EMBEDS
 * ======================================================== */
function autoExpandSapo(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

let postTagsList = [];

function handleTagInputKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const input = document.getElementById('form-post-tags-input');
    const val = input ? input.value.trim().replace(/,/g, '') : '';
    if (val && !postTagsList.includes(val)) {
      postTagsList.push(val);
      renderTagBadges();
      input.value = '';
    }
  }
}

function removeTagBadge(index) {
  postTagsList.splice(index, 1);
  renderTagBadges();
}

function renderTagBadges() {
  const container = document.getElementById('tags-badges-container');
  const input = document.getElementById('form-post-tags-input');
  const hiddenInput = document.getElementById('form-post-tags');

  if (!container || !input) return;

  if (hiddenInput) hiddenInput.value = postTagsList.join(',');

  const badgesHtml = postTagsList.map((tag, idx) => `
    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
      #${tag}
      <button type="button" onclick="removeTagBadge(${idx})" class="hover:text-red-600 font-extrabold ml-1">&times;</button>
    </span>
  `).join('');

  container.innerHTML = badgesHtml;
  container.appendChild(input);
}

function insertJournalisticTable() {
  const tableHtml = `
    <div class="my-5 overflow-x-auto">
      <table class="w-full text-left border-collapse border border-slate-300 text-xs my-2">
        <thead>
          <tr class="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
            <th class="p-2 border border-slate-300">Tiêu chí 1</th>
            <th class="p-2 border border-slate-300">Tiêu chí 2</th>
            <th class="p-2 border border-slate-300">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-slate-200">
            <td class="p-2 border border-slate-200">Dữ liệu A</td>
            <td class="p-2 border border-slate-200">Dữ liệu B</td>
            <td class="p-2 border border-slate-200">Thông tin chi tiết...</td>
          </tr>
          <tr class="border-b border-slate-200 bg-slate-50">
            <td class="p-2 border border-slate-200">Dữ liệu C</td>
            <td class="p-2 border border-slate-200">Dữ liệu D</td>
            <td class="p-2 border border-slate-200">Thông tin chi tiết...</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  document.execCommand('insertHTML', false, tableHtml);
}

function openLivePreviewFromForm() {
  const title = document.getElementById('form-post-title').value.trim();
  const sapo = document.getElementById('form-post-sapo').value.trim();
  const editorArea = document.getElementById('editor-content-area');
  const content = editorArea ? editorArea.innerHTML.trim() : '';

  openDocxLivePreview({
    title: title || 'Tiêu đề xem trước bài báo',
    sapo: sapo || 'Tóm tắt bài viết xem trước',
    htmlContent: content || '<p>Nội dung trống</p>',
    extractedImages: []
  });
}

function insertJournalisticHighlightBox() {
  const boxHtml = `
    <div class="my-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-slate-800 shadow-sm">
      <strong class="block text-amber-900 text-sm mb-1 uppercase tracking-wide">Ghi chú Tòa soạn / Highlight Box:</strong>
      <p class="text-xs italic leading-relaxed">Nhập nội dung thông tin nổi bật hoặc điểm tin quan trọng tại đây...</p>
    </div>
  `;
  document.execCommand('insertHTML', false, boxHtml);
}

function insertJournalisticPullQuote() {
  const quoteHtml = `
    <blockquote class="my-6 p-4 border-l-4 border-purple-600 bg-purple-50/60 rounded-r-2xl italic font-serif text-base text-purple-950 shadow-sm">
      "Nhập câu trích dẫn nổi bật cuốn hút (Pull-quote) của nhân vật tại đây..."
      <span class="block text-xs font-sans font-bold text-purple-700 mt-2 not-italic">— Tên Nhân Vật / Chức danh</span>
    </blockquote>
  `;
  document.execCommand('insertHTML', false, quoteHtml);
}

function insertJournalisticRelatedArticles() {
  const relatedHtml = `
    <div class="my-5 p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
      <div class="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
        Bài viết liên quan
      </div>
      <ul class="list-disc list-inside text-xs text-blue-700 font-semibold space-y-1">
        <li><a href="#" class="hover:underline">Tiêu đề bài viết liên quan 1...</a></li>
        <li><a href="#" class="hover:underline">Tiêu đề bài viết liên quan 2...</a></li>
      </ul>
    </div>
  `;
  document.execCommand('insertHTML', false, relatedHtml);
}

function openInsertImageModal() {
  const modal = document.getElementById('modal-insert-image');
  if (modal) modal.classList.remove('hidden');
}

function closeInsertImageModal() {
  const modal = document.getElementById('modal-insert-image');
  if (modal) modal.classList.add('hidden');
}

async function uploadInsertImageModalFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  try {
    const res = await ApiService.uploadMedia(file);
    if (res && res.url) {
      document.getElementById('insert-img-url').value = res.url;
    }
  } catch (err) {
    alert("Lỗi upload ảnh!");
  }
}

function confirmInsertImageToEditor() {
  const url = document.getElementById('insert-img-url').value.trim();
  const caption = document.getElementById('insert-img-caption').value.trim();
  const source = document.getElementById('insert-img-source').value.trim();

  if (!url) {
    alert("Vui lòng nhập URL ảnh!");
    return;
  }

  const figureHtml = `
    <figure class="my-5 text-center inline-block w-full">
      <img src="${url}" alt="${caption || 'Image'}" class="w-full rounded-2xl shadow-md inline-block max-h-[500px] object-cover" />
      <figcaption class="mt-2 text-xs text-slate-500 font-medium italic focus:outline-none focus:bg-amber-50 p-1.5 rounded-lg border border-dashed border-amber-300" contenteditable="true">
        ${caption ? caption : 'Nhập chú thích ảnh ở đây...'} ${source ? `(Nguồn: ${source})` : ''}
      </figcaption>
    </figure>
  `;

  document.getElementById('editor-content-area').focus();
  document.execCommand('insertHTML', false, figureHtml);
  closeInsertImageModal();

  // Re-setup preview image click listeners so floating toolbar works for newly inserted image!
  setupPreviewImageControls();

  // Reset inputs
  document.getElementById('insert-img-url').value = '';
  document.getElementById('insert-img-caption').value = '';
  document.getElementById('insert-img-source').value = '';
}

/* ========================================================
 * 8. DYNAMIC ROLE-BASED ACTION BUTTONS
 * ======================================================== */
function renderFormActionButtons() {
  const role = getUserRole();
  const container = document.getElementById('form-action-buttons');

  if (container) {
    if (role === 'SUPER_ADMIN') {
      container.innerHTML = `
        <button type="button" onclick="submitPostWithStatus('DRAFT')" class="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition">
          Lưu Bản Nháp
        </button>
        <button type="button" onclick="submitPostWithStatus('PENDING_APPROVAL')" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition">
          Chuyển Trạng Thái Chờ Duyệt
        </button>
        <button type="button" onclick="openRejectModalFromForm()" class="w-full py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl transition">
          Trả Bài / Yêu Cầu Sửa
        </button>
        <button type="button" onclick="submitPostWithStatus('PUBLISHED')" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow transition">
          Xuất Bản Ngay (Publish Now)
        </button>
      `;
    } else {
      // Ngoài SUPER_ADMIN (EDITOR_IN_CHIEF, EDITOR, AUTHOR): Không có quyền đăng bài trực tiếp, chỉ được lưu nháp hoặc gửi chờ Admin duyệt
      container.innerHTML = `
        <button type="button" onclick="submitPostWithStatus('DRAFT')" class="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition">
          Lưu Bản Nháp (Draft)
        </button>
        <button type="button" onclick="submitPostWithStatus('PENDING_APPROVAL')" class="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow transition">
          Gửi Chờ Duyệt (Submit For Approval)
        </button>
      `;
    }
  }

  // Cập nhật nút Xuất bản / Gửi chờ duyệt trên thanh công cụ phía trên form soạn thảo
  const topBtn = document.getElementById('btn-top-submit-post');
  const topIcon = document.getElementById('btn-top-submit-icon');
  const topText = document.getElementById('btn-top-submit-text');
  if (topBtn) {
    if (role === 'SUPER_ADMIN') {
      topBtn.className = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5";
      topBtn.title = "Xuất bản bài viết trực tiếp";
      if (topIcon) topIcon.innerText = "";
      if (topText) topText.innerText = "Xuất Bản";
    } else {
      topBtn.className = "px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5";
      topBtn.title = "Gửi bài viết chờ Quản trị viên (Admin) xét duyệt";
      if (topIcon) topIcon.innerText = "";
      if (topText) topText.innerText = "Gửi Chờ Duyệt";
    }
  }

  // Cập nhật nút Xuất bản / Gửi chờ duyệt trong popup Import Word (.docx)
  const docxBtn = document.getElementById('btn-docx-publish');
  const docxText = document.getElementById('btn-docx-publish-text');
  if (docxBtn) {
    if (role === 'SUPER_ADMIN') {
      docxBtn.className = "px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5";
      if (docxText) docxText.innerText = "Xuất Bản Ngay";
    } else {
      docxBtn.className = "px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5";
      if (docxText) docxText.innerText = "Gửi Chờ Duyệt";
    }
  }
}

function handleTopFormSubmit() {
  const role = getUserRole();
  if (role === 'SUPER_ADMIN') {
    submitPostWithStatus('PUBLISHED');
  } else {
    submitPostWithStatus('PENDING_APPROVAL');
  }
}

function handleDocxPublishByRole() {
  const role = getUserRole();
  if (role === 'SUPER_ADMIN') {
    saveDocxDirectly('PUBLISHED');
  } else {
    saveDocxDirectly('PENDING_APPROVAL');
  }
}

function openRejectModalFromForm() {
  const id = document.getElementById('form-post-id').value;
  if (!id) {
    alert("Vui lòng lưu bài viết trước khi trả bài!");
    return;
  }
  openRejectModal(id);
}

function openRejectModal(id) {
  document.getElementById('reject-post-id-input').value = id;
  const modal = document.getElementById('modal-reject-reason');
  if (modal) modal.classList.remove('hidden');
}

function closeRejectModal() {
  const modal = document.getElementById('modal-reject-reason');
  if (modal) modal.classList.add('hidden');
}

async function confirmRejectPostWithReason() {
  const id = document.getElementById('reject-post-id-input').value;
  const reason = document.getElementById('reject-reason-textarea').value.trim();

  if (!reason) {
    alert("Vui lòng nhập lý do từ chối!");
    return;
  }

  try {
    await ApiService.updatePostStatus(id, 'REJECTED', reason);
    alert(`Đã trả bài viết #${id} cho Tác giả kèm góp ý!`);
    closeRejectModal();
    togglePostForm(false);
    loadPostsTable();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi từ chối bài viết!");
  }
}

async function submitPostWithStatus(statusTarget) {
  const role = getUserRole();
  if (role !== 'SUPER_ADMIN' && statusTarget === 'PUBLISHED') {
    alert("Chỉ Quản trị viên (Admin) mới có quyền đăng bài xuất bản trực tiếp! Bài viết sẽ được gửi ở trạng thái Chờ duyệt.");
    statusTarget = 'PENDING_APPROVAL';
  }

  const statusSelect = document.getElementById('form-post-status');
  if (statusSelect) statusSelect.value = statusTarget;

  // Check schedule date
  const scheduleInput = document.getElementById('form-post-schedule');
  if (scheduleInput && scheduleInput.value && statusTarget === 'PUBLISHED') {
    const scheduledDate = new Date(scheduleInput.value);
    if (scheduledDate > new Date()) {
      alert(`Bài viết được hẹn giờ đăng tự động vào lúc: ${scheduledDate.toLocaleString()}`);
    }
  }

  const form = document.getElementById('admin-post-form');
  if (form) {
    const event = new Event('submit', { cancelable: true });
    form.dispatchEvent(event);
  }
}

/* ========================================================
 * 9. QUẢN LÝ BÀI VIẾT (POSTS MANAGEMENT & SCOPING)
 * ======================================================== */
function filterPostsByStatus(status) {
  currentPostStatus = status;
  const buttons = document.querySelectorAll('.post-filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-status') === status) {
      btn.className = 'post-filter-btn px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm';
    } else {
      btn.className = 'post-filter-btn px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200';
    }
  });
  loadPostsTable();
}

async function loadPostsTable(searchFilter = globalSearchKeyword) {
  const table = document.getElementById('admin-posts-table');
  if (!table) return;

  table.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Đang tải danh sách bài viết...</td></tr>`;

  try {
    let posts = await ApiService.getAdminPosts(currentPostStatus);
    const role = getUserRole();

    // Data Scoping: AUTHOR only views their own posts
    if (role === 'AUTHOR') {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      if (currentUser && currentUser.username) {
        posts = (posts || []).filter(p => p.authorName === currentUser.username || !p.authorName);
      }
    }

    // Keyword filtering from search bar
    if (searchFilter && searchFilter.trim() !== '') {
      const kw = searchFilter.toLowerCase().trim();
      posts = (posts || []).filter(p => 
        (p.title && p.title.toLowerCase().includes(kw)) ||
        (p.authorName && p.authorName.toLowerCase().includes(kw)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(kw))
      );
    }

    if (!posts || posts.length === 0) {
      table.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Không có bài viết nào phù hợp.</td></tr>`;
      return;
    }

    table.innerHTML = posts.map(p => {
      // Standardized Badge Colors (#22c55e success, #f59e0b pending, #ef4444 rejected)
      let statusBadge = '';
      if (p.status === 'PUBLISHED') {
        statusBadge = `<span class="px-2.5 py-1 text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full">Đã xuất bản</span>`;
      } else if (p.status === 'PENDING_APPROVAL') {
        statusBadge = `<span class="px-2.5 py-1 text-xs font-extrabold text-amber-700 bg-amber-100 border border-amber-200 rounded-full">Chờ duyệt</span>`;
      } else if (p.status === 'REJECTED') {
        statusBadge = `<span class="px-2.5 py-1 text-xs font-extrabold text-rose-700 bg-rose-100 border border-rose-200 rounded-full" title="${p.rejectionReason || 'Chưa rõ lý do'}">Bị từ chối</span>`;
      } else {
        statusBadge = `<span class="px-2.5 py-1 text-xs font-extrabold text-slate-700 bg-slate-100 border border-slate-200 rounded-full">Bản nháp</span>`;
      }

      // Spotlight / Trending columns
      let spotlightCol = '';
      if (role === 'AUTHOR' || role === 'EDITOR') {
        const spIcon = p.isSpotlight ? 'Bật' : '—';
        const trIcon = p.isTrending ? 'Bật' : '—';
        spotlightCol = `<div class="text-xs font-medium text-slate-500">${spIcon} / ${trIcon}</div>`;
      } else {
        // SUPER_ADMIN, EDITOR_IN_CHIEF
        const spotlightIcon = p.isSpotlight ? 'Bật' : 'Tắt';
        const spotlightClass = p.isSpotlight ? 'text-amber-500 font-bold' : 'text-slate-300';
        const trendingIcon = p.isTrending ? 'Bật' : 'Tắt';
        const trendingClass = p.isTrending ? 'text-rose-500 font-bold' : 'text-slate-300';
        spotlightCol = `
          <div class="flex items-center gap-2">
            <button onclick="handleToggleSpotlight(${p.id})" title="Ghim Spotlight Trang chủ" class="p-1 rounded hover:bg-slate-200 ${spotlightClass}">${spotlightIcon}</button>
            <button onclick="handleToggleTrending(${p.id})" title="Ghim Xu hướng Trending" class="p-1 rounded hover:bg-slate-200 ${trendingClass}">${trendingIcon}</button>
          </div>
        `;
      }

      // Actions Column based on RBAC matrix: SUPER_ADMIN và EDITOR_IN_CHIEF có quyền duyệt bài xuất bản
      let actionsHtml = '';
      if (role === 'SUPER_ADMIN' || role === 'EDITOR_IN_CHIEF') {
        actionsHtml = `
          ${p.status !== 'PUBLISHED' ? `
            <button onclick="handleApprovePost(${p.id})" title="Duyệt & Xuất bản" class="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded border border-emerald-200">
              Duyệt
            </button>
          ` : ''}
          ${p.status === 'PENDING_APPROVAL' ? `
            <button onclick="openRejectModal(${p.id})" title="Từ chối với lý do" class="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded border border-rose-200">
              Trả bài
            </button>
          ` : ''}
          <button onclick="handleEditPost(${p.id})" title="Chỉnh sửa bài viết" class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded border border-blue-200">
            Sửa
          </button>
          <button onclick="handleDeletePost(${p.id})" title="Xóa bài viết" class="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded border border-red-200">
            Xóa
          </button>
        `;
      } else {
        // Các role khác (EDITOR, AUTHOR): Không có quyền duyệt bài
        if (p.status === 'PUBLISHED' || p.status === 'PENDING_APPROVAL') {
          actionsHtml = `
            <span class="px-2.5 py-1 bg-slate-100 text-slate-400 font-semibold text-xs rounded border border-slate-200 inline-flex items-center gap-1 cursor-not-allowed" title="Bài viết đang chờ Admin/TBT duyệt hoặc đã xuất bản, không thể chỉnh sửa/xóa">
              Đã khóa (Chờ duyệt)
            </span>
          `;
        } else {
          // DRAFT or REJECTED
          actionsHtml = `
            <button onclick="handleEditPost(${p.id})" title="Chỉnh sửa bài viết" class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded border border-blue-200">
              Sửa
            </button>
            <button onclick="handleDeletePost(${p.id})" title="Xóa bài viết" class="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded border border-red-200">
              Xóa
            </button>
          `;
        }
      }

      const seriesBadge = p.seriesName
        ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 rounded mr-1">Tuyến: ${p.seriesName} (Kỳ ${p.seriesOrder || 1})</span>`
        : '';

      const formatBadge = (p.postFormat && p.postFormat !== 'STANDARD')
        ? `<span class="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded mr-1 uppercase">${p.postFormat}</span>`
        : '';

      const bylineDisplay = p.byline ? `${p.byline} <span class="text-slate-400 font-normal">(@${p.authorName || 'user'})</span>` : (p.authorName || 'Tòa soạn');

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
          <td class="p-3.5 max-w-sm">
            <div class="flex items-center gap-1 mb-1">
              ${seriesBadge}
              ${formatBadge}
            </div>
            <div class="font-bold text-slate-900 line-clamp-1 hover:text-blue-600 cursor-pointer" onclick="window.open('article-detail.html?slug=${p.slug}', '_blank')">
              ${p.title}
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5 line-clamp-1">${p.sapo || ''}</div>
          </td>
          <td class="p-3.5 text-xs text-slate-600 font-semibold whitespace-nowrap">${p.categoryName || '-'}</td>
          <td class="p-3.5 text-xs text-slate-700 whitespace-nowrap font-medium">${bylineDisplay}</td>
          <td class="p-3.5 whitespace-nowrap">${statusBadge}</td>
          <td class="p-3.5 whitespace-nowrap">${spotlightCol}</td>
          <td class="p-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">
            <span class="inline-flex items-center gap-1">${EYE_ICON_SVG} <span>${p.viewsCount || 0}</span></span>
          </td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              ${actionsHtml}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    table.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-red-500">Lỗi nạp bài viết!</td></tr>`;
  }
}

function togglePostForm(forceShow = null) {
  const container = document.getElementById('post-form-container');
  const btnIcon = document.getElementById('btn-toggle-post-icon');
  const btnText = document.getElementById('btn-toggle-post-text');

  const willShow = forceShow !== null ? forceShow : container.classList.contains('hidden');

  if (willShow) {
    container.classList.remove('hidden');
    btnIcon.innerText = '×';
    btnText.innerText = 'Đóng Form';
    renderFormActionButtons();
  } else {
    container.classList.add('hidden');
    btnIcon.innerText = '+';
    btnText.innerText = 'Tạo Bài Viết Mới';
    resetPostForm();
  }
}

function resetPostForm() {
  document.getElementById('admin-post-form').reset();
  document.getElementById('form-post-id').value = '';
  document.getElementById('editor-content-area').innerHTML = '';
  document.getElementById('form-post-content').value = '';
  document.getElementById('thumbnail-preview-img').src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600';
  document.getElementById('post-form-heading').innerText = 'Sáng Tác & Soạn Thảo Bài Viết';

  const bylineEl = document.getElementById('form-post-byline');
  if (bylineEl) bylineEl.value = '';
  const formatEl = document.getElementById('form-post-format');
  if (formatEl) formatEl.value = 'STANDARD';
  const readingTimeEl = document.getElementById('form-post-reading-time');
  if (readingTimeEl) readingTimeEl.value = '';
  const seriesNameEl = document.getElementById('form-post-series-name');
  if (seriesNameEl) seriesNameEl.value = '';
  const seriesOrderEl = document.getElementById('form-post-series-order');
  if (seriesOrderEl) seriesOrderEl.value = '';
  const thumbSourceEl = document.getElementById('form-post-thumbnail-source');
  if (thumbSourceEl) thumbSourceEl.value = '';

  const role = getUserRole();
  const statusSelect = document.getElementById('form-post-status');
  if (statusSelect) {
    if (role === 'SUPER_ADMIN' || role === 'EDITOR_IN_CHIEF') {
      statusSelect.innerHTML = `
        <option value="DRAFT" class="text-slate-600">DRAFT (Bản nháp)</option>
        <option value="PENDING_APPROVAL" class="text-amber-600">PENDING_APPROVAL (Chờ duyệt)</option>
        <option value="PUBLISHED" class="text-emerald-600">PUBLISHED (Đã xuất bản)</option>
        <option value="REJECTED" class="text-rose-600">REJECTED (Bị từ chối)</option>
      `;
      statusSelect.value = 'PUBLISHED';
    } else {
      statusSelect.innerHTML = `
        <option value="PENDING_APPROVAL" class="text-amber-600">PENDING_APPROVAL (Chờ Admin duyệt)</option>
        <option value="DRAFT" class="text-slate-600">DRAFT (Bản nháp)</option>
      `;
      statusSelect.value = 'PENDING_APPROVAL';
    }
  }

  applyRolePermissions(role);
  renderFormActionButtons();
  updateEditorialCounters();
}

async function handleEditPost(id) {
  try {
    const post = await ApiService.getPostById(id);
    if (!post) {
      alert("Không tìm thấy bài viết!");
      return;
    }

    const role = getUserRole();
    if (role !== 'SUPER_ADMIN' && role !== 'EDITOR_IN_CHIEF' && (post.status === 'PUBLISHED' || post.status === 'PENDING_APPROVAL')) {
      alert("Bài viết đang ở trạng thái Chờ Admin duyệt hoặc Đã xuất bản. Chỉ Quản trị viên hoặc Tổng biên tập mới có quyền chỉnh sửa!");
      return;
    }

    document.getElementById('form-post-id').value = post.id;
    document.getElementById('form-post-title').value = post.title || '';
    document.getElementById('form-post-sapo').value = post.sapo || '';
    document.getElementById('form-post-thumbnail').value = post.thumbnailUrl || '';
    document.getElementById('thumbnail-preview-img').src = post.thumbnailUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600';
    
    const bylineEl = document.getElementById('form-post-byline');
    if (bylineEl) bylineEl.value = post.byline || '';
    const formatEl = document.getElementById('form-post-format');
    if (formatEl) formatEl.value = post.postFormat || 'STANDARD';
    const readingTimeEl = document.getElementById('form-post-reading-time');
    if (readingTimeEl) readingTimeEl.value = post.readingTime || '';
    const seriesNameEl = document.getElementById('form-post-series-name');
    if (seriesNameEl) seriesNameEl.value = post.seriesName || '';
    const seriesOrderEl = document.getElementById('form-post-series-order');
    if (seriesOrderEl) seriesOrderEl.value = post.seriesOrder || '';
    const thumbSourceEl = document.getElementById('form-post-thumbnail-source');
    if (thumbSourceEl) thumbSourceEl.value = post.thumbnailCredit || '';

    const statusSelect = document.getElementById('form-post-status');
    if (statusSelect) {
      if (role === 'SUPER_ADMIN' || role === 'EDITOR_IN_CHIEF') {
        statusSelect.innerHTML = `
          <option value="DRAFT" class="text-slate-600">DRAFT (Bản nháp)</option>
          <option value="PENDING_APPROVAL" class="text-amber-600">PENDING_APPROVAL (Chờ duyệt)</option>
          <option value="PUBLISHED" class="text-emerald-600">PUBLISHED (Đã xuất bản)</option>
          <option value="REJECTED" class="text-rose-600">REJECTED (Bị từ chối)</option>
        `;
        statusSelect.value = post.status || 'PUBLISHED';
      } else {
        statusSelect.innerHTML = `
          <option value="PENDING_APPROVAL" class="text-amber-600">PENDING_APPROVAL (Chờ Admin duyệt)</option>
          <option value="DRAFT" class="text-slate-600">DRAFT (Bản nháp)</option>
        `;
        statusSelect.value = (post.status === 'DRAFT') ? 'DRAFT' : 'PENDING_APPROVAL';
      }
    }

    document.getElementById('form-post-spotlight').checked = Boolean(post.isSpotlight);
    document.getElementById('form-post-trending').checked = Boolean(post.isTrending);

    const allowCommentsElem = document.getElementById('form-post-allow-comments');
    if (allowCommentsElem) allowCommentsElem.checked = post.allowComments !== false;

    const content = post.content || '';
    document.getElementById('editor-content-area').innerHTML = content;
    document.getElementById('form-post-content').value = content;

    const catSelect = document.getElementById('form-post-category');
    if (post.categorySlug) catSelect.value = post.categorySlug;

    document.getElementById('post-form-heading').innerText = `Chỉnh Sửa Bài Viết #${post.id}`;
    togglePostForm(true);
    applyRolePermissions(role);
    renderFormActionButtons();
    updateEditorialCounters();

    document.getElementById('post-form-container').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert("Lỗi khi nạp bài viết để chỉnh sửa!");
  }
}

async function handleSavePost(e) {
  e.preventDefault();

  const editorArea = document.getElementById('editor-content-area');
  const contentHtml = editorArea ? editorArea.innerHTML.trim() : '';
  document.getElementById('form-post-content').value = contentHtml;

  if (!contentHtml || contentHtml === '<br>') {
    alert("Vui lòng nhập nội dung bài viết!");
    return;
  }

  const id = document.getElementById('form-post-id').value;
  const allowCommentsElem = document.getElementById('form-post-allow-comments');
  const bylineEl = document.getElementById('form-post-byline');
  const formatEl = document.getElementById('form-post-format');
  const readingTimeEl = document.getElementById('form-post-reading-time');
  const seriesNameEl = document.getElementById('form-post-series-name');
  const seriesOrderEl = document.getElementById('form-post-series-order');
  const thumbSourceEl = document.getElementById('form-post-thumbnail-source');

  const postData = {
    title: document.getElementById('form-post-title').value.trim(),
    sapo: document.getElementById('form-post-sapo').value.trim(),
    categorySlug: document.getElementById('form-post-category').value,
    thumbnailUrl: document.getElementById('form-post-thumbnail').value.trim() || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600',
    thumbnailCredit: thumbSourceEl ? thumbSourceEl.value.trim() : '',
    byline: bylineEl ? bylineEl.value.trim() : '',
    postFormat: formatEl ? formatEl.value : 'STANDARD',
    readingTime: (readingTimeEl && readingTimeEl.value) ? parseInt(readingTimeEl.value) : null,
    seriesName: seriesNameEl ? seriesNameEl.value.trim() : null,
    seriesOrder: (seriesOrderEl && seriesOrderEl.value) ? parseInt(seriesOrderEl.value) : null,
    content: contentHtml,
    status: document.getElementById('form-post-status').value,
    isSpotlight: document.getElementById('form-post-spotlight').checked,
    isTrending: document.getElementById('form-post-trending').checked,
    allowComments: allowCommentsElem ? allowCommentsElem.checked : true
  };

  try {
    let res;
    if (id) {
      res = await ApiService.updatePost(id, postData);
      if (res && res.id) alert(`Đã cập nhật bài viết #${id} thành công!`);
    } else {
      res = await ApiService.createPost(postData);
      if (res && res.id) alert("Đã tạo bài viết mới thành công!");
    }

    togglePostForm(false);
    loadPostsTable();
    loadDashboardData();
  } catch (err) {
    alert(err.message || "Lỗi khi lưu bài viết!");
  }
}

async function handleDeletePost(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bài viết #${id}?`)) return;
  try {
    await ApiService.deletePost(id);
    alert(`Đã xóa bài viết #${id}!`);
    loadPostsTable();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi xóa bài viết!");
  }
}

async function handleApprovePost(id) {
  const role = getUserRole();
  if (role !== 'SUPER_ADMIN') {
    alert("Chỉ Quản trị viên (Admin) mới có quyền duyệt và xuất bản bài viết!");
    return;
  }
  try {
    await ApiService.updatePostStatus(id, 'PUBLISHED');
    alert(`Đã duyệt và xuất bản bài viết #${id}!`);
    loadPostsTable();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi duyệt bài viết!");
  }
}

async function handleToggleSpotlight(id) {
  try {
    await ApiService.toggleSpotlight(id);
    loadPostsTable();
  } catch (err) {
    alert("Lỗi khi đổi Spotlight!");
  }
}

async function handleToggleTrending(id) {
  try {
    await ApiService.toggleTrending(id);
    loadPostsTable();
  } catch (err) {
    alert("Lỗi khi đổi Trending!");
  }
}

/* ========================================================
 * 10. QUẢN LÝ CHUYÊN MỤC (CATEGORIES MANAGEMENT)
 * ======================================================== */
async function loadCategoriesDropdown() {
  const select = document.getElementById('form-post-category');
  if (!select) return;

  try {
    const categories = await ApiService.getCategories();
    allCategoriesList = categories || [];

    if (allCategoriesList.length > 0) {
      select.innerHTML = allCategoriesList.map(c => `
        <option value="${c.slug}">${c.name}</option>
      `).join('');
    } else {
      select.innerHTML = `<option value="thoi-su">Thời sự (Mặc định)</option>`;
    }
  } catch (err) {
    console.error("Lỗi nạp danh mục:", err);
  }
}

async function loadCategoriesTable() {
  const table = document.getElementById('admin-categories-table');
  if (!table) return;

  table.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">Đang tải danh mục...</td></tr>`;

  try {
    const categories = await ApiService.getCategories();
    allCategoriesList = categories || [];

    if (!categories || categories.length === 0) {
      table.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">Chưa có danh mục nào.</td></tr>`;
      return;
    }

    table.innerHTML = categories.map(c => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="p-3.5 text-xs font-mono font-bold text-slate-400">#${c.id}</td>
        <td class="p-3.5 font-bold text-slate-900">${c.name}</td>
        <td class="p-3.5 text-xs text-blue-600 font-mono">${c.slug}</td>
        <td class="p-3.5 text-xs text-slate-500 max-w-xs truncate">${c.description || '-'}</td>
        <td class="p-3.5 text-right whitespace-nowrap">
          <button onclick="handleEditCategory(${c.id}, '${escapeHtml(c.name)}', '${escapeHtml(c.slug)}', '${escapeHtml(c.description || '')}')" class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded border border-blue-200 mr-1">
            Sửa
          </button>
          <button onclick="handleDeleteCategory(${c.id}, '${escapeHtml(c.name)}')" class="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded border border-red-200">
            Xóa
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    table.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Lỗi nạp danh mục!</td></tr>`;
  }
}

function handleEditCategory(id, name, slug, desc) {
  document.getElementById('form-cat-id').value = id;
  document.getElementById('form-cat-name').value = name;
  document.getElementById('form-cat-slug').value = slug;
  document.getElementById('form-cat-desc').value = desc;
  document.getElementById('category-form-heading').innerText = `Chỉnh Sửa Chuyên Mục #${id}`;
}

function resetCategoryForm() {
  document.getElementById('category-form').reset();
  document.getElementById('form-cat-id').value = '';
  document.getElementById('category-form-heading').innerText = 'Thêm Chuyên Mục Mới';
}

async function handleSaveCategory(e) {
  e.preventDefault();
  const id = document.getElementById('form-cat-id').value;
  const name = document.getElementById('form-cat-name').value.trim();
  const slug = document.getElementById('form-cat-slug').value.trim();
  const description = document.getElementById('form-cat-desc').value.trim();

  const catData = { name, slug, description };

  try {
    if (id) {
      await ApiService.updateCategory(id, catData);
      alert(`Đã cập nhật chuyên mục "${name}"!`);
    } else {
      await ApiService.createCategory(catData);
      alert(`Đã tạo chuyên mục mới "${name}"!`);
    }

    resetCategoryForm();
    loadCategoriesTable();
    loadCategoriesDropdown();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi lưu chuyên mục!");
  }
}

async function handleDeleteCategory(id, name) {
  if (!confirm(`Bạn có chắc muốn xóa chuyên mục "${name}"?`)) return;
  try {
    await ApiService.deleteCategory(id);
    alert(`Đã xóa chuyên mục "${name}"!`);
    loadCategoriesTable();
    loadCategoriesDropdown();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi xóa chuyên mục!");
  }
}

/* ========================================================
 * 11. QUẢN LÝ NGƯỜI DÙNG & RBAC MATRIX (USER & ROLE MANAGEMENT)
 * ======================================================== */
async function loadUsersTable() {
  filterUsersTable();
}

async function filterUsersTable() {
  const table = document.getElementById('admin-users-table');
  const countBadge = document.getElementById('users-count-badge');
  const roleFilter = document.getElementById('filter-user-role')?.value || 'ALL';
  const statusFilter = document.getElementById('filter-user-status')?.value || 'ALL';

  if (!table) return;

  table.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Đang nạp danh sách người dùng...</td></tr>`;

  try {
    let users = await ApiService.getUsers();

    if (roleFilter !== 'ALL') {
      users = (users || []).filter(u => (u.role || '').toUpperCase() === roleFilter);
    }
    if (statusFilter !== 'ALL') {
      users = (users || []).filter(u => (u.status || '').toUpperCase() === statusFilter);
    }

    if (countBadge) countBadge.innerText = (users || []).length;

    if (!users || users.length === 0) {
      table.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Không tìm thấy tài khoản phù hợp.</td></tr>`;
      return;
    }

    table.innerHTML = users.map(u => {
      // Standardized Role matrix label mapping
      let roleBadge = '';
      const r = (u.role || '').toUpperCase();
      if (r === 'SUPER_ADMIN') {
        roleBadge = `<span class="px-2.5 py-1 text-xs font-black bg-purple-100 text-purple-800 border border-purple-200 rounded-full uppercase">Quản Trị Hệ Thống</span>`;
      } else if (r === 'EDITOR_IN_CHIEF') {
        roleBadge = `<span class="px-2.5 py-1 text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full uppercase">Tổng Biên Tập</span>`;
      } else if (r === 'EDITOR') {
        roleBadge = `<span class="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 rounded-full uppercase">Biên Tập Viên</span>`;
      } else if (r === 'AUTHOR') {
        roleBadge = `<span class="px-2.5 py-1 text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 rounded-full uppercase">Tác Giả / PV</span>`;
      } else {
        roleBadge = `<span class="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-full uppercase">Độc Giả</span>`;
      }

      // Standardized status colors (#22c55e ACTIVE, #ef4444 BLOCKED)
      const isBlocked = u.status === 'BLOCKED';
      const statusBadge = isBlocked
        ? `<span class="px-2 py-0.5 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 rounded-full">ĐÃ KHÓA</span>`
        : `<span class="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full">HOẠT ĐỘNG</span>`;

      // Scope placeholder
      const scopeBadge = r === 'EDITOR' ? `<span class="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">Thời sự, Thể thao</span>` : `<span class="text-xs text-slate-400">Tất cả mảng</span>`;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
          <td class="p-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shadow-inner">
                ${(u.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="font-bold text-slate-900">${u.username}</div>
                <div class="text-[11px] text-slate-500">${u.fullName || '-'}</div>
              </div>
            </div>
          </td>
          <td class="p-3.5 text-xs text-slate-600 font-mono">${u.email || '-'}</td>
          <td class="p-3.5 whitespace-nowrap">${roleBadge}</td>
          <td class="p-3.5 whitespace-nowrap">${scopeBadge}</td>
          <td class="p-3.5 whitespace-nowrap">${statusBadge}</td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="handleEditUserModal(${u.id}, '${escapeHtml(u.username)}', '${escapeHtml(u.fullName || '')}', '${escapeHtml(u.email || '')}', '${u.role}', '${u.status}')" class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded border border-blue-200">
                Sửa quyền
              </button>
              ${u.username !== 'admin' ? `
                <button onclick="handleToggleUserStatus(${u.id}, '${u.status}')" class="px-2 py-1 ${isBlocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'} font-bold text-xs rounded border">
                  ${isBlocked ? 'Mở khóa' : 'Khóa'}
                </button>
                <button onclick="handleDeleteUser(${u.id}, '${escapeHtml(u.username)}')" class="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded border border-red-200">
                  Xóa
                </button>
              ` : `<span class="text-[10px] text-slate-400 font-bold">Root Admin</span>`}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    table.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500">Lỗi nạp danh sách người dùng!</td></tr>`;
  }
}

function toggleUserModal(show, isEdit = false) {
  const modal = document.getElementById('user-modal');
  if (!modal) return;

  if (show) {
    modal.classList.remove('hidden');
    renderUserCategoryMatrixCheckboxes();
    if (!isEdit) {
      document.getElementById('user-modal-form').reset();
      document.getElementById('form-user-id').value = '';
      document.getElementById('user-modal-title').innerText = 'Thêm Người Dùng Mới';
    }
  } else {
    modal.classList.add('hidden');
  }
}

function renderUserCategoryMatrixCheckboxes() {
  const container = document.getElementById('user-assigned-categories-container');
  if (!container) return;

  if (allCategoriesList.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400">Đang nạp danh mục...</span>`;
    return;
  }

  container.innerHTML = allCategoriesList.map(c => `
    <label class="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-100">
      <input type="checkbox" value="${c.slug}" checked class="w-3.5 h-3.5 text-blue-600 rounded">
      <span class="truncate">${c.name}</span>
    </label>
  `).join('');
}

function handleEditUserModal(id, username, fullname, email, role, status) {
  document.getElementById('form-user-id').value = id;
  document.getElementById('form-user-username').value = username;
  document.getElementById('form-user-fullname').value = fullname;
  document.getElementById('form-user-email').value = email;
  document.getElementById('form-user-role').value = role || 'USER';
  document.getElementById('form-user-status').value = status || 'ACTIVE';
  document.getElementById('form-user-password').value = '';
  document.getElementById('user-modal-title').innerText = `Sửa Vai Trò & Phân Quyền Matrix: ${username}`;

  toggleUserModal(true, true);
}

async function handleSaveUser(e) {
  e.preventDefault();
  const id = document.getElementById('form-user-id').value;
  const username = document.getElementById('form-user-username').value.trim();
  const fullName = document.getElementById('form-user-fullname').value.trim();
  const email = document.getElementById('form-user-email').value.trim();
  const role = document.getElementById('form-user-role').value;
  const status = document.getElementById('form-user-status').value;
  const password = document.getElementById('form-user-password').value.trim();

  const userData = { username, fullName, email, role, status };
  if (password) userData.passwordHash = password;

  try {
    if (id) {
      await ApiService.updateUser(id, userData);
      alert(`Đã cập nhật vai trò & quyền hạn cho "${username}"!`);
    } else {
      await ApiService.createUser(userData);
      alert(`Tạo người dùng mới "${username}" thành công!`);
    }

    toggleUserModal(false);
    loadUsersTable();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi lưu thông tin người dùng!");
  }
}

async function handleToggleUserStatus(id, currentStatus) {
  const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
  try {
    await ApiService.toggleUserStatus(id, newStatus);
    loadUsersTable();
  } catch (err) {
    alert("Lỗi khi đổi trạng thái tài khoản!");
  }
}

async function handleDeleteUser(id, username) {
  if (!confirm(`Bạn có chắc muốn xóa tài khoản "${username}"?`)) return;
  try {
    await ApiService.deleteUser(id);
    alert(`Đã xóa tài khoản "${username}"!`);
    loadUsersTable();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi xóa người dùng!");
  }
}

/* ========================================================
 * 12. DIGITAL ASSET MANAGEMENT (MEDIA DAM GALLERY)
 * ======================================================== */
async function loadDAMGallery() {
  const grid = document.getElementById('dam-gallery-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400">Đang tải thư viện ảnh DAM...</div>`;

  const sampleImages = [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600'
  ];

  grid.innerHTML = sampleImages.map((url, i) => `
    <div class="group relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video shadow-sm">
      <img src="${url}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
        <button onclick="copyDAMUrl('${url}')" class="px-2.5 py-1.5 bg-blue-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-blue-700">
          Sao chép URL
        </button>
      </div>
    </div>
  `).join('');
}

async function uploadToDAMGallery(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  try {
    const res = await ApiService.uploadMedia(file);
    if (res && res.url) {
      alert("Tải tệp media lên thư viện DAM thành công!");
      loadDAMGallery();
    }
  } catch (err) {
    alert("Lỗi khi tải tệp lên DAM!");
  }
}

function copyDAMUrl(url) {
  navigator.clipboard.writeText(url);
  alert("Đã sao chép đường dẫn URL ảnh vào Clipboard!");
}

/* ========================================================
 * 13. QUẢN LÝ COMMENT (COMMENTS - CHỈ DÀNH CHO ADMIN)
 * ======================================================== */
function filterCommentsByStatus(status) {
  currentCommentStatus = status;
  const buttons = document.querySelectorAll('.comment-filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-status') === status) {
      btn.className = 'comment-filter-btn px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm';
    } else {
      btn.className = 'comment-filter-btn px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200';
    }
  });
  loadCommentsTable();
}

async function loadCommentsTable() {
  const table = document.getElementById('admin-comments-table');
  if (!table) return;

  const role = getUserRole();
  if (role !== 'SUPER_ADMIN') {
    table.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-rose-500 font-bold">Bạn không có quyền truy cập vào mục Quản lý Comment (Chỉ dành riêng cho Admin)!</td></tr>`;
    return;
  }

  table.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">Đang nạp bình luận...</td></tr>`;

  try {
    const comments = await ApiService.getComments(currentCommentStatus);

    if (!comments || comments.length === 0) {
      table.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">Không có bình luận nào.</td></tr>`;
      return;
    }

    table.innerHTML = comments.map(c => {
      const isHidden = (c.status === 'HIDDEN' || c.status === 'REJECTED' || c.status === 'SPAM');
      let statusBadge = isHidden
        ? `<span class="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full">Đã ẩn</span>`
        : `<span class="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full">Đang hiển thị</span>`;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
          <td class="p-3.5 whitespace-nowrap">
            <div class="font-bold text-slate-900">${c.userName || 'Độc giả'}</div>
            <div class="text-[11px] text-slate-400 font-mono">${c.email || ''}</div>
          </td>
          <td class="p-3.5 max-w-md">
            <div class="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 ${isHidden ? 'opacity-60 italic' : ''}">
              ${c.content}
            </div>
          </td>
          <td class="p-3.5 text-xs text-blue-600 font-semibold max-w-xs truncate">
            ${c.postTitle || `Bài viết #${c.postId || ''}`}
          </td>
          <td class="p-3.5 whitespace-nowrap">${statusBadge}</td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              ${isHidden ? `
                <button onclick="handleToggleHideComment(${c.id}, 'APPROVED')" title="Hiển thị lại bình luận trên bài viết" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1">
                  Hiện
                </button>
              ` : `
                <button onclick="handleToggleHideComment(${c.id}, 'HIDDEN')" title="Ẩn bình luận khỏi bài viết" class="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs rounded-lg border border-amber-200 flex items-center gap-1">
                  Ẩn
                </button>
              `}
              <button onclick="handleDeleteComment(${c.id})" title="Xóa vĩnh viễn bình luận" class="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-lg border border-rose-200 flex items-center gap-1">
                Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    table.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Lỗi nạp bình luận!</td></tr>`;
  }
}

async function handleToggleHideComment(id, newStatus) {
  const role = getUserRole();
  if (role !== 'SUPER_ADMIN') {
    alert("Chỉ quản trị viên (Admin) mới có quyền ẩn/hiện bình luận!");
    return;
  }
  try {
    await ApiService.moderateComment(id, newStatus);
    loadCommentsTable();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi cập nhật trạng thái bình luận!");
  }
}

async function handleDeleteComment(id) {
  const role = getUserRole();
  if (role !== 'SUPER_ADMIN') {
    alert("Chỉ quản trị viên (Admin) mới có quyền xóa bình luận!");
    return;
  }
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bình luận #${id}?`)) return;
  try {
    await ApiService.deleteComment(id);
    alert(`Đã xóa bình luận #${id} thành công!`);
    loadCommentsTable();
    loadDashboardData();
  } catch (err) {
    alert("Lỗi khi xóa bình luận!");
  }
}

/* ========================================================
 * 14. KEYBOARD SHORTCUTS & HELPERS
 * ======================================================== */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl + S: Save draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      const formContainer = document.getElementById('post-form-container');
      if (formContainer && !formContainer.classList.contains('hidden')) {
        e.preventDefault();
        submitPostWithStatus('DRAFT');
      }
    }

    // Ctrl + Enter: Submit / Publish
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const formContainer = document.getElementById('post-form-container');
      if (formContainer && !formContainer.classList.contains('hidden')) {
        e.preventDefault();
        const role = getUserRole();
        if (role === 'AUTHOR') submitPostWithStatus('PENDING_APPROVAL');
        else submitPostWithStatus('PUBLISHED');
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* WYSIWYG COMMAND EXECUTOR */
function execEditorCommand(cmd, val = null) {
  document.execCommand(cmd, false, val);
  document.getElementById('editor-content-area').focus();
}

function setEditorLightText() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const span = document.createElement('span');
  span.style.color = '#94a3b8';
  span.style.fontWeight = '300';
  const range = selection.getRangeAt(0);
  range.surroundContents(span);
}

function insertEditorLink() {
  const url = prompt("Nhập URL đường dẫn (Hyperlink):", "https://");
  if (url) {
    document.execCommand('createLink', false, url);
  }
}

async function uploadThumbnailFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  try {
    const res = await ApiService.uploadMedia(file);
    if (res && res.url) {
      document.getElementById('form-post-thumbnail').value = res.url;
      document.getElementById('thumbnail-preview-img').src = res.url;
      alert("Tải ảnh đại diện thành công!");
    }
  } catch (err) {
    alert("Lỗi khi tải ảnh đại diện!");
  }
}

async function uploadContentImageFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  await insertImageFileToEditor(file);
}

async function insertImageFileToEditor(file) {
  try {
    const res = await ApiService.uploadMedia(file);
    if (res && res.url) {
      document.getElementById('editor-content-area').focus();
      const imgHtml = `<img src="${res.url}" alt="Image" class="my-4 rounded-xl max-w-full shadow-md inline-block" />`;
      document.execCommand('insertHTML', false, imgHtml);
    }
  } catch (err) {
    alert("Lỗi khi tải ảnh lên editor!");
  }
}

// Paste Event listener for images in editor
document.addEventListener('DOMContentLoaded', () => {
  const editorArea = document.getElementById('editor-content-area');
  if (editorArea) {
    editorArea.addEventListener('paste', async (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await insertImageFileToEditor(file);
          }
        }
      }
    });
  }
  setupDocxDragAndDrop();
});

/* ========================================================
 * 15. WORD FILE IMPORT (.DOCX) & LIVE ARTICLE PREVIEW (INLINE EDITING)
 * ======================================================== */
let currentDocxImportData = null;

function openDocxImportModal() {
  const modal = document.getElementById('modal-docx-import');
  if (modal) modal.classList.remove('hidden');
}

function closeDocxImportModal() {
  const modal = document.getElementById('modal-docx-import');
  if (modal) modal.classList.add('hidden');
}

function closeDocxPreviewModal() {
  const modal = document.getElementById('modal-docx-preview');
  if (modal) modal.classList.add('hidden');
}

function setupDocxDragAndDrop() {
  const dropZone = document.getElementById('docx-drop-zone');
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('bg-purple-100', 'border-purple-600');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('bg-purple-100', 'border-purple-600');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleDocxFile(files[0]);
    }
  });
}

function handleDocxFileSelected(input) {
  if (input.files && input.files[0]) {
    handleDocxFile(input.files[0]);
  }
}

async function handleDocxFile(file) {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    alert("Vui lòng chọn file văn bản định dạng Microsoft Word (.docx)!");
    return;
  }

  const spinner = document.getElementById('docx-upload-spinner');
  const dropZone = document.getElementById('docx-drop-zone');
  if (spinner) spinner.classList.remove('hidden');
  if (dropZone) dropZone.classList.add('hidden');

  try {
    const data = await ApiService.importDocxPost(file);
    currentDocxImportData = data;

    if (spinner) spinner.classList.add('hidden');
    if (dropZone) dropZone.classList.remove('hidden');
    closeDocxImportModal();

    // Hiển thị Màn hình Live Preview (Mô phỏng Giao diện Đọc Bài Báo Thực Tế)
    openDocxLivePreview(data);
  } catch (err) {
    if (spinner) spinner.classList.add('hidden');
    if (dropZone) dropZone.classList.remove('hidden');
    alert(err.message || "Lỗi khi chuyển đổi file Word!");
  }
}

function openDocxLivePreview(data) {
  const modal = document.getElementById('modal-docx-preview');
  if (!modal) return;

  document.getElementById('preview-article-title').innerText = data.title || 'Tiêu đề bài viết từ file Word';
  document.getElementById('preview-article-sapo').innerText = data.sapo || 'Tóm tắt nội dung bài viết...';
  document.getElementById('preview-article-body').innerHTML = data.htmlContent || '<p>Nội dung trống</p>';

  // Setup inline editable image click controls
  setupPreviewImageControls();

  renderFormActionButtons();

  modal.classList.remove('hidden');
}

let activeSelectedImg = null;

function setupPreviewImageControls() {
  const containers = [
    document.getElementById('preview-article-body'),
    document.getElementById('editor-content-area')
  ];

  containers.forEach(container => {
    if (!container) return;

    const images = container.querySelectorAll('img');
    images.forEach(img => {
      img.style.cursor = 'pointer';
      img.title = 'Click để tùy chỉnh Căn lề / Size / Caption / Xóa ảnh';
    });
  });
}

// Global Event Delegation for Image Clicks & Auto-hide
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    if (e.target && e.target.tagName === 'IMG') {
      const editorArea = document.getElementById('editor-content-area');
      const previewArea = document.getElementById('preview-article-body');
      
      if ((editorArea && editorArea.contains(e.target)) || (previewArea && previewArea.contains(e.target))) {
        e.stopPropagation();
        showFloatingImageToolbar(e.target);
      }
    } else {
      const toolbar = document.getElementById('floating-image-toolbar');
      if (toolbar && !toolbar.contains(e.target)) {
        hideFloatingImageToolbar();
      }
    }
  });

  // Escape key hides toolbar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideFloatingImageToolbar();
    }
  });
});

function showFloatingImageToolbar(imgEl) {
  if (activeSelectedImg && activeSelectedImg !== imgEl) {
    activeSelectedImg.style.outline = 'none';
  }

  activeSelectedImg = imgEl;
  imgEl.style.outline = '3px solid #3b82f6';
  imgEl.style.outlineOffset = '4px';

  const toolbar = document.getElementById('floating-image-toolbar');
  if (!toolbar) return;

  const rect = imgEl.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  const topPos = rect.top + scrollTop - 50;
  const leftPos = rect.left + scrollLeft + (rect.width / 2) - 180;

  toolbar.style.top = `${Math.max(10, topPos)}px`;
  toolbar.style.left = `${Math.max(10, leftPos)}px`;
  toolbar.classList.remove('hidden');
}

function hideFloatingImageToolbar() {
  const toolbar = document.getElementById('floating-image-toolbar');
  if (toolbar) toolbar.classList.add('hidden');
  if (activeSelectedImg) {
    activeSelectedImg.style.outline = 'none';
    activeSelectedImg = null;
  }
}

function setImgAlign(align) {
  if (!activeSelectedImg) return;

  const parent = activeSelectedImg.parentElement;

  if (align === 'left') {
    activeSelectedImg.style.float = 'left';
    activeSelectedImg.style.margin = '0.5rem 1rem 1rem 0';
    activeSelectedImg.style.display = 'inline-block';
    if (parent && parent.tagName.toLowerCase() === 'figure') {
      parent.style.float = 'left';
      parent.style.margin = '0.5rem 1rem 1rem 0';
      parent.style.display = 'inline-block';
    }
  } else if (align === 'center') {
    activeSelectedImg.style.float = 'none';
    activeSelectedImg.style.margin = '1rem auto';
    activeSelectedImg.style.display = 'block';
    if (parent && parent.tagName.toLowerCase() === 'figure') {
      parent.style.float = 'none';
      parent.style.margin = '1rem auto';
      parent.style.display = 'block';
      parent.style.textAlign = 'center';
    }
  } else if (align === 'right') {
    activeSelectedImg.style.float = 'right';
    activeSelectedImg.style.margin = '0.5rem 0 1rem 1rem';
    activeSelectedImg.style.display = 'inline-block';
    if (parent && parent.tagName.toLowerCase() === 'figure') {
      parent.style.float = 'right';
      parent.style.margin = '0.5rem 0 1rem 1rem';
      parent.style.display = 'inline-block';
    }
  }

  showFloatingImageToolbar(activeSelectedImg);
}

function setImgSize(percent) {
  if (!activeSelectedImg) return;
  activeSelectedImg.style.width = `${percent}%`;
  const parent = activeSelectedImg.parentElement;
  if (parent && parent.tagName.toLowerCase() === 'figure') {
    parent.style.width = `${percent}%`;
  }
  showFloatingImageToolbar(activeSelectedImg);
}

function toggleImgCaption() {
  if (!activeSelectedImg) return;

  let parent = activeSelectedImg.parentElement;
  if (parent && parent.tagName.toLowerCase() === 'figure') {
    let figcaption = parent.querySelector('figcaption');
    if (!figcaption) {
      figcaption = document.createElement('figcaption');
      figcaption.className = 'mt-2 text-xs text-slate-500 font-medium italic focus:outline-none focus:bg-amber-50 p-1.5 rounded-lg border border-dashed border-amber-300';
      figcaption.contentEditable = 'true';
      figcaption.innerText = 'Nhập chú thích ảnh & Nguồn ảnh tại đây...';
      parent.appendChild(figcaption);
    }
    figcaption.focus();
  } else {
    const figure = document.createElement('figure');
    figure.className = 'my-4 text-center inline-block w-full';
    
    activeSelectedImg.parentNode.insertBefore(figure, activeSelectedImg);
    figure.appendChild(activeSelectedImg);

    const figcaption = document.createElement('figcaption');
    figcaption.className = 'mt-2 text-xs text-slate-500 font-medium italic focus:outline-none focus:bg-amber-50 p-1.5 rounded-lg border border-dashed border-amber-300';
    figcaption.contentEditable = 'true';
    figcaption.innerText = 'Nhập chú thích ảnh & Nguồn ảnh tại đây...';
    figure.appendChild(figcaption);

    figcaption.focus();
  }
}

function deleteSelectedImg() {
  if (!activeSelectedImg) return;
  const parent = activeSelectedImg.parentElement;
  if (parent && parent.tagName.toLowerCase() === 'figure') {
    parent.remove();
  } else {
    activeSelectedImg.remove();
  }
  hideFloatingImageToolbar();
}

function applyDocxToPostForm() {
  const editedTitle = document.getElementById('preview-article-title').innerText.trim();
  const editedSapo = document.getElementById('preview-article-sapo').innerText.trim();
  const editedBody = document.getElementById('preview-article-body').innerHTML.trim();

  document.getElementById('form-post-title').value = editedTitle;
  document.getElementById('form-post-sapo').value = editedSapo;
  document.getElementById('editor-content-area').innerHTML = editedBody;
  document.getElementById('form-post-content').value = editedBody;

  // Set thumbnail from first image if available
  if (currentDocxImportData && currentDocxImportData.extractedImages && currentDocxImportData.extractedImages.length > 0) {
    const thumbUrl = currentDocxImportData.extractedImages[0];
    document.getElementById('form-post-thumbnail').value = thumbUrl;
    const thumbImg = document.getElementById('thumbnail-preview-img');
    if (thumbImg) thumbImg.src = thumbUrl;
  }

  closeDocxPreviewModal();
  togglePostForm(true);
  updateEditorialCounters();

  document.getElementById('post-form-container').scrollIntoView({ behavior: 'smooth' });
}

async function saveDocxDirectly(statusTarget = 'DRAFT') {
  const role = getUserRole();
  if (role !== 'SUPER_ADMIN' && statusTarget === 'PUBLISHED') {
    alert("Chỉ Quản trị viên (Admin) mới có quyền đăng bài xuất bản trực tiếp! Bài viết sẽ được gửi ở trạng thái Chờ duyệt.");
    statusTarget = 'PENDING_APPROVAL';
  }

  const editedTitle = document.getElementById('preview-article-title').innerText.trim();
  const editedSapo = document.getElementById('preview-article-sapo').innerText.trim();
  const editedBody = document.getElementById('preview-article-body').innerHTML.trim();

  let thumbUrl = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600';
  if (currentDocxImportData && currentDocxImportData.extractedImages && currentDocxImportData.extractedImages.length > 0) {
    thumbUrl = currentDocxImportData.extractedImages[0];
  }

  const defaultCategorySlug = allCategoriesList.length > 0 ? allCategoriesList[0].slug : 'thoi-su';

  const postData = {
    title: editedTitle || 'Bài viết từ Word',
    sapo: editedSapo || 'Tóm tắt bài viết',
    categorySlug: defaultCategorySlug,
    thumbnailUrl: thumbUrl,
    content: editedBody,
    status: statusTarget,
    isSpotlight: false,
    isTrending: false,
    allowComments: true
  };

  try {
    const res = await ApiService.createPost(postData);
    if (res && res.id) {
      alert(`Đã lưu bài viết từ Word thành công (Trạng thái: ${statusTarget})!`);
      closeDocxPreviewModal();
      loadPostsTable();
      loadDashboardData();
    }
  } catch (err) {
    alert("Lỗi khi lưu bài viết!");
  }
}

/* ========================================================
 * 15. QUẢN LÝ QUẢNG CÁO & BANNER NATIVE (ADVERTISEMENTS)
 * ======================================================== */
let allAdvertisementsList = [];

async function loadAdvertisementsTable() {
  const tbody = document.getElementById('admin-ads-table');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Đang tải danh sách banner quảng cáo...</td></tr>`;

  try {
    const ads = await ApiService.getAdminAdvertisements();
    allAdvertisementsList = ads || [];
    if (!ads || ads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Chưa có banner quảng cáo nào. Nhấn "Thêm Banner Mới" để tạo!</td></tr>`;
      return;
    }

    tbody.innerHTML = ads.map(ad => {
      const positionLabel = {
        'HOME_TOP': '<span class="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md">Trang chủ (Top Banner)</span>',
        'HOME_SIDEBAR': '<span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md">Trang chủ (Cột bên)</span>',
        'ARTICLE_SIDEBAR': '<span class="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-md">Bài viết (Cột bên)</span>'
      }[ad.position] || `<span class="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">${ad.position}</span>`;

      const statusBadge = ad.isActive
        ? `<button onclick="handleToggleAdStatus(${ad.id})" title="Nhấn để tắt" class="px-2.5 py-1 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg inline-flex items-center gap-1 transition">
             <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Đang BẬT
           </button>`
        : `<button onclick="handleToggleAdStatus(${ad.id})" title="Nhấn để bật" class="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg inline-flex items-center gap-1 transition">
             <span class="w-2 h-2 rounded-full bg-slate-400"></span> Đã TẮT
           </button>`;

      return `
        <tr class="hover:bg-slate-50/70 transition">
          <td class="p-3.5">
            <div class="w-24 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              <img src="${ad.imageUrl}" class="w-full h-full object-cover" alt="Banner" onerror="this.src='https://placehold.co/300x100?text=Banner'">
            </div>
          </td>
          <td class="p-3.5 font-bold text-slate-800 text-xs">${ad.title || 'Không có tiêu đề'}</td>
          <td class="p-3.5">${positionLabel}</td>
          <td class="p-3.5 text-xs">
            <a href="${ad.targetUrl}" target="_blank" class="text-blue-600 hover:underline font-mono truncate block max-w-xs">${ad.targetUrl}</a>
          </td>
          <td class="p-3.5 font-mono font-bold text-slate-700 text-xs">
            <span class="px-2 py-0.5 bg-slate-100 rounded-md">${Number(ad.clickCount || 0).toLocaleString()} clicks</span>
          </td>
          <td class="p-3.5">${statusBadge}</td>
          <td class="p-3.5 text-right space-x-1.5 whitespace-nowrap">
            <button onclick="openAdModalById(${ad.id})" class="p-1.5 px-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-bold transition">Sửa</button>
            <button onclick="handleDeleteAd(${ad.id})" class="p-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition">Xóa</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-rose-500">Lỗi khi tải quảng cáo: ${err.message}</td></tr>`;
  }
}

function openAdModalById(id) {
  const ad = allAdvertisementsList.find(a => a.id === id);
  openAdModal(ad);
}

function openAdModal(ad = null) {
  const modal = document.getElementById('modal-ad');
  if (!modal) return;
  modal.classList.remove('hidden');

  const titleEl = document.getElementById('ad-modal-title');
  const idInput = document.getElementById('form-ad-id');
  const titleInput = document.getElementById('form-ad-title');
  const posSelect = document.getElementById('form-ad-position');
  const imgInput = document.getElementById('form-ad-image-url');
  const targetInput = document.getElementById('form-ad-target-url');
  const activeCheck = document.getElementById('form-ad-active');
  const previewImg = document.getElementById('form-ad-preview-img');

  if (ad) {
    if (titleEl) titleEl.innerText = `Sửa Banner Quảng Cáo #${ad.id}`;
    if (idInput) idInput.value = ad.id;
    if (titleInput) titleInput.value = ad.title || '';
    if (posSelect) posSelect.value = ad.position || 'HOME_TOP';
    if (imgInput) imgInput.value = ad.imageUrl || '';
    if (targetInput) targetInput.value = ad.targetUrl || '';
    if (activeCheck) activeCheck.checked = ad.isActive !== false;
    if (previewImg) {
      previewImg.src = ad.imageUrl || '';
      previewImg.classList.toggle('hidden', !ad.imageUrl);
    }
  } else {
    if (titleEl) titleEl.innerText = 'Thêm Mới Banner Quảng Cáo';
    if (idInput) idInput.value = '';
    if (titleInput) titleInput.value = '';
    if (posSelect) posSelect.value = 'HOME_TOP';
    if (imgInput) imgInput.value = '';
    if (targetInput) targetInput.value = '';
    if (activeCheck) activeCheck.checked = true;
    if (previewImg) {
      previewImg.src = '';
      previewImg.classList.add('hidden');
    }
  }
}

function closeAdModal() {
  const modal = document.getElementById('modal-ad');
  if (modal) modal.classList.add('hidden');
}

async function uploadAdBannerFile(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  try {
    const res = await ApiService.uploadMedia(file);
    const url = res.fileUrl || res.url;
    if (url) {
      document.getElementById('form-ad-image-url').value = url;
      const preview = document.getElementById('form-ad-preview-img');
      if (preview) {
        preview.src = url;
        preview.classList.remove('hidden');
      }
    }
  } catch (err) {
    alert("Tải ảnh banner thất bại: " + err.message);
  }
}

async function handleSaveAdvertisement(e) {
  e.preventDefault();
  const id = document.getElementById('form-ad-id').value;
  const adData = {
    title: document.getElementById('form-ad-title').value.trim(),
    position: document.getElementById('form-ad-position').value,
    imageUrl: document.getElementById('form-ad-image-url').value.trim(),
    targetUrl: document.getElementById('form-ad-target-url').value.trim(),
    isActive: document.getElementById('form-ad-active').checked
  };

  try {
    if (id) {
      await ApiService.updateAdvertisement(id, adData);
      alert(`Đã cập nhật banner #${id}!`);
    } else {
      await ApiService.createAdvertisement(adData);
      alert("Đã tạo banner quảng cáo mới!");
    }
    closeAdModal();
    loadAdvertisementsTable();
  } catch (err) {
    alert("Lỗi lưu banner: " + err.message);
  }
}

async function handleToggleAdStatus(id) {
  try {
    await ApiService.toggleAdvertisementStatus(id);
    loadAdvertisementsTable();
  } catch (err) {
    alert("Lỗi thay đổi trạng thái banner: " + err.message);
  }
}

async function handleDeleteAd(id) {
  if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn banner #${id}?`)) return;
  try {
    await ApiService.deleteAdvertisement(id);
    loadAdvertisementsTable();
  } catch (err) {
    alert("Lỗi xóa banner: " + err.message);
  }
}

/* ========================================================
 * 16. THĂM DÒ Ý KIẾN / BÌNH CHỌN (INTERACTIVE POLLS)
 * ======================================================== */
async function loadPollsTable() {
  const tbody = document.getElementById('admin-polls-table');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Đang tải danh sách cuộc bình chọn...</td></tr>`;

  try {
    const polls = await ApiService.getAdminPolls();
    if (!polls || polls.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Chưa có cuộc bình chọn nào. Nhấn "Tạo Bình Chọn Mới" để tạo!</td></tr>`;
      return;
    }

    tbody.innerHTML = polls.map(p => {
      const postBadge = p.postId
        ? `<a href="article-detail.html?id=${p.postId}" target="_blank" class="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 hover:underline rounded border border-blue-200">Bài viết #${p.postId} ↗</a>`
        : `<span class="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded">Trang chủ / Chung</span>`;

      const totalVotes = (p.options || []).reduce((acc, opt) => acc + (opt.votesCount || 0), 0);

      const optionsHtml = (p.options || []).map(opt => {
        const pct = totalVotes > 0 ? Math.round((opt.votesCount * 100 / totalVotes) * 10) / 10 : 0;
        return `
          <div class="space-y-1 mb-1 text-xs">
            <div class="flex justify-between text-[11px] font-medium text-slate-700">
              <span>• ${opt.optionText}</span>
              <span class="font-bold font-mono text-purple-700">${opt.votesCount || 0} phiếu (${pct}%)</span>
            </div>
            <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div class="bg-purple-600 h-full rounded-full transition-all" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

      const statusBadge = p.isActive
        ? `<button onclick="handleTogglePollStatus(${p.id})" title="Nhấn để tắt" class="px-2 py-0.5 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg inline-flex items-center gap-1 transition">
             <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Đang mở
           </button>`
        : `<button onclick="handleTogglePollStatus(${p.id})" title="Nhấn để mở" class="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg inline-flex items-center gap-1 transition">
             <span class="w-2 h-2 rounded-full bg-slate-400"></span> Đã đóng
           </button>`;

      return `
        <tr class="hover:bg-slate-50/70 transition">
          <td class="p-3.5 font-bold text-slate-900 text-xs max-w-xs">${p.question}</td>
          <td class="p-3.5">${postBadge}</td>
          <td class="p-3.5 min-w-[240px]">
            <div class="text-[11px] text-slate-500 mb-1 font-semibold">Tổng: <strong class="text-slate-800">${totalVotes}</strong> lượt vote</div>
            ${optionsHtml}
          </td>
          <td class="p-3.5">${statusBadge}</td>
          <td class="p-3.5 text-xs text-slate-500 font-mono">${formatDate(p.createdAt)}</td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <button onclick="handleDeletePoll(${p.id})" class="p-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition">Xóa</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-rose-500">Lỗi khi tải bình chọn: ${err.message}</td></tr>`;
  }
}

function openPollModal() {
  const modal = document.getElementById('modal-poll');
  if (!modal) return;
  modal.classList.remove('hidden');

  document.getElementById('form-poll-question').value = '';
  document.getElementById('form-poll-post-id').value = '';
  const container = document.getElementById('poll-options-container');
  if (container) {
    container.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="w-5 text-center font-bold text-slate-400">1.</span>
        <input type="text" class="poll-option-input flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Phương án 1" required>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-5 text-center font-bold text-slate-400">2.</span>
        <input type="text" class="poll-option-input flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Phương án 2" required>
      </div>
    `;
  }
}

function closePollModal() {
  const modal = document.getElementById('modal-poll');
  if (modal) modal.classList.add('hidden');
}

function addPollOptionRow() {
  const container = document.getElementById('poll-options-container');
  if (!container) return;
  const count = container.querySelectorAll('.poll-option-input').length + 1;
  const row = document.createElement('div');
  row.className = 'flex items-center gap-2';
  row.innerHTML = `
    <span class="w-5 text-center font-bold text-slate-400">${count}.</span>
    <input type="text" class="poll-option-input flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Phương án ${count}" required>
    <button type="button" onclick="this.parentElement.remove()" class="p-1.5 text-slate-400 hover:text-rose-600 font-bold">&times;</button>
  `;
  container.appendChild(row);
}

async function handleSavePoll(e) {
  e.preventDefault();
  const question = document.getElementById('form-poll-question').value.trim();
  const postIdVal = document.getElementById('form-poll-post-id').value.trim();
  const optionsInputs = document.querySelectorAll('.poll-option-input');

  const options = [];
  optionsInputs.forEach(input => {
    const val = input.value.trim();
    if (val) options.push(val);
  });

  if (options.length < 2) {
    alert("Cuộc bình chọn phải có ít nhất 2 phương án lựa chọn!");
    return;
  }

  const pollData = {
    question: question,
    postId: postIdVal ? parseInt(postIdVal) : null,
    options: options
  };

  try {
    await ApiService.createPoll(pollData);
    alert("Đã tạo cuộc bình chọn mới thành công!");
    closePollModal();
    loadPollsTable();
  } catch (err) {
    alert("Lỗi khi tạo bình chọn: " + err.message);
  }
}

async function handleTogglePollStatus(id) {
  try {
    await ApiService.togglePollStatus(id);
    loadPollsTable();
  } catch (err) {
    alert("Lỗi thay đổi trạng thái bình chọn: " + err.message);
  }
}

async function handleDeletePoll(id) {
  if (!confirm(`Bạn có chắc muốn xóa cuộc bình chọn #${id}?`)) return;
  try {
    await ApiService.deletePoll(id);
    loadPollsTable();
  } catch (err) {
    alert("Lỗi xóa bình chọn: " + err.message);
  }
}

