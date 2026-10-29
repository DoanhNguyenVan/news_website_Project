/**
 * USER DASHBOARD CONTROLLER (user.js)
 * Quản lý trang cá nhân: Bài viết đã lưu, Lịch sử đọc, Chủ đề yêu thích, Hồ sơ, Đổi mật khẩu
 */

let currentUserData = null;
let savedArticlesList = [];
let allCategoriesList = [];
let userSelectedCategoryIds = [];

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert("Vui lòng đăng nhập để truy cập trang cá nhân!");
    window.location.href = 'index.html?auth=login';
    return;
  }

  // Khởi tạo tab từ URL hash nếu có (ví dụ: user.html#bookmarks)
  const hasHash = Boolean(window.location.hash);
  const initialTab = hasHash ? window.location.hash.replace('#', '') : 'bookmarks';

  await loadUserProfile();
  await loadUserStats();
  switchTab(initialTab, hasHash);
});

/**
 * 1. Nạp thông tin người dùng từ /api/v1/auth/me
 */
async function loadUserProfile() {
  try {
    const user = await ApiService.getMe();
    if (!user) {
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      logoutUser();
      return;
    }
    currentUserData = user;

    // Cập nhật Hero Profile
    const fullName = user.fullName || user.username || 'Độc giả';
    document.getElementById('user-hero-fullname').innerText = fullName;
    document.getElementById('user-hero-username').innerText = user.username || '';
    document.getElementById('user-hero-email').innerText = user.email || '';
    
    // Ngày tham gia
    if (user.createdAt) {
      const d = new Date(user.createdAt);
      document.getElementById('user-hero-created').innerText = d.toLocaleDateString('vi-VN');
    }

    // Role badge
    const roleBadge = document.getElementById('user-hero-role');
    const roleName = user.role ? user.role.toUpperCase() : 'USER';
    const roleMap = {
      'SUPER_ADMIN': 'QUẢN TRỊ TỐI CAO',
      'EDITOR_IN_CHIEF': 'TỔNG BIÊN TẬP',
      'EDITOR': 'BIÊN TẬP VIÊN',
      'AUTHOR': 'PHÓNG VIÊN / TÁC GIẢ',
      'USER': 'ĐỘC GIẢ THÀNH VIÊN'
    };
    roleBadge.innerText = roleMap[roleName] || roleName;

    // Auth Provider
    const providerBadge = document.getElementById('user-hero-provider');
    const isGoogle = (user.authProvider || '').toUpperCase() === 'GOOGLE';
    if (isGoogle) {
      providerBadge.innerHTML = '<svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg><span>Đăng nhập bằng Google</span>';
      providerBadge.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5';
      document.getElementById('google-auth-notice').classList.remove('hidden');
      document.getElementById('local-password-form').classList.add('hidden');
    } else {
      providerBadge.innerHTML = '<svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg><span>Tài khoản mật khẩu</span>';
      providerBadge.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1.5';
      document.getElementById('google-auth-notice').classList.add('hidden');
      document.getElementById('local-password-form').classList.remove('hidden');
    }

    // Avatar
    const avatarContainer = document.getElementById('user-hero-avatar');
    if (user.avatarUrl && user.avatarUrl.trim() !== '') {
      avatarContainer.innerHTML = `<img src="${user.avatarUrl}" class="w-full h-full object-cover" alt="${fullName}">`;
    } else {
      avatarContainer.innerHTML = `<span id="user-hero-initial">${fullName.charAt(0).toUpperCase()}</span>`;
    }

    // Form Hồ sơ
    document.getElementById('input-profile-fullname').value = fullName;
    document.getElementById('input-profile-avatar').value = user.avatarUrl || '';
    document.getElementById('readonly-profile-username').innerText = user.username || '';
    document.getElementById('readonly-profile-email').innerText = user.email || '';

  } catch (err) {
    console.error("Lỗi nạp thông tin user:", err);
  }
}

/**
 * 2. Nạp số liệu thống kê KPI
 */
async function loadUserStats() {
  try {
    const stats = await ApiService.getUserStats();
    if (stats) {
      document.getElementById('stat-bookmarks-count').innerText = stats.bookmarksCount || 0;
      document.getElementById('stat-history-count').innerText = stats.historyCount || 0;
      document.getElementById('stat-topics-count').innerText = stats.topicsCount || 0;
      document.getElementById('stat-comments-count').innerText = stats.commentsCount || 0;
    }
  } catch (err) {
    console.warn("Lỗi nạp stats:", err);
  }
}

/**
 * 3. Chuyển đổi Tab (Pill tabs)
 */
function switchTab(tabId, shouldScroll = false) {
  const validTabs = ['bookmarks', 'history', 'preferences', 'comments', 'profile', 'security'];
  if (!validTabs.includes(tabId)) tabId = 'bookmarks';

  // Update Buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-blue-600', 'text-white', 'shadow-xs');
    btn.classList.add('text-slate-600', 'hover:bg-white', 'hover:text-slate-900');
  });
  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'bg-blue-600', 'text-white', 'shadow-xs');
    activeBtn.classList.remove('text-slate-600', 'hover:bg-white', 'hover:text-slate-900');
  }

  // Update Panes
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
  const activePane = document.getElementById(`tab-content-${tabId}`);
  if (activePane) {
    activePane.classList.remove('hidden');
    if (shouldScroll) {
      setTimeout(() => {
        activePane.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // Update URL hash
  window.history.replaceState(null, null, `#${tabId}`);

  // Tự động load dữ liệu cho từng tab
  if (tabId === 'bookmarks') loadUserBookmarks();
  if (tabId === 'history') loadUserHistory();
  if (tabId === 'preferences') loadUserPreferences();
  if (tabId === 'comments') loadUserComments();
}

/**
 * 4. TAB 1: Danh sách Bài viết đã lưu
 */
async function loadUserBookmarks() {
  const grid = document.getElementById('bookmarks-grid');
  grid.innerHTML = `<div class="col-span-full py-12 text-center text-xs text-slate-400">Đang đồng bộ bài viết đã lưu...</div>`;

  try {
    const list = await ApiService.getBookmarks(0, 50);
    savedArticlesList = Array.isArray(list) ? list : [];
    document.getElementById('stat-bookmarks-count').innerText = savedArticlesList.length;

    renderBookmarksGrid(savedArticlesList);
  } catch (err) {
    console.error("Lỗi nạp bài đã lưu:", err);
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-xs text-rose-500">Không thể tải danh sách bài đã lưu.</div>`;
  }
}

function renderBookmarksGrid(posts) {
  const grid = document.getElementById('bookmarks-grid');
  if (!posts || posts.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center space-y-3 bg-white rounded-3xl border border-dashed border-slate-200">
        <svg class="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
        <h4 class="text-sm font-bold text-slate-800">Chưa có bài viết nào được lưu</h4>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Khi đọc bất kỳ tin tức nào, bạn chỉ cần bấm vào nút <strong>Lưu bài</strong> để đọc lại tại đây mọi lúc.
        </p>
        <a href="index.html" class="inline-block mt-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">
          Khám phá tin tức ngay
        </a>
      </div>
    `;
    return;
  }

  grid.innerHTML = posts.map(post => {
    const thumb = post.thumbnailUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600';
    const readTime = post.readingTime ? `${post.readingTime}p đọc` : '3p đọc';
    const catName = post.categoryName || 'Tin tức';

    return `
      <div id="bookmark-card-${post.id}" class="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
        <div>
          <div class="relative overflow-hidden h-44 cursor-pointer" onclick="location.href='article-detail.html?slug=${post.slug}'">
            <img src="${thumb}" loading="lazy" decoding="async" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600'" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="${post.title}">
            <span class="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md shadow-xs">
              ${catName}
            </span>
          </div>
          <div class="p-4 space-y-2">
            <div class="flex items-center gap-2 text-[11px] text-slate-400">
              <span class="inline-flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>${readTime}</span>
              </span>
              <span>•</span>
              <span class="text-slate-500 font-medium">${post.viewsCount || 0} lượt xem</span>
            </div>
            <h4 class="font-serif text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug cursor-pointer" onclick="location.href='article-detail.html?slug=${post.slug}'">
              ${post.title}
            </h4>
            <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              ${post.sapo || ''}
            </p>
          </div>
        </div>
        <div class="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
          <a href="article-detail.html?slug=${post.slug}" class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Đọc bài viết →
          </a>
          <button onclick="removeBookmarkItem(${post.id})" class="text-xs font-semibold text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition flex items-center gap-1" title="Gỡ khỏi danh sách đã lưu">
            <svg class="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            <span>Gỡ bỏ</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterSavedArticles() {
  const query = (document.getElementById('filter-bookmarks-input').value || '').toLowerCase().trim();
  if (!query) {
    renderBookmarksGrid(savedArticlesList);
    return;
  }
  const filtered = savedArticlesList.filter(p => 
    (p.title && p.title.toLowerCase().includes(query)) ||
    (p.sapo && p.sapo.toLowerCase().includes(query))
  );
  renderBookmarksGrid(filtered);
}

async function removeBookmarkItem(postId) {
  try {
    await ApiService.toggleBookmark(postId);
    
    // Gỡ khỏi DOM với animation mượt
    const card = document.getElementById(`bookmark-card-${postId}`);
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.remove();
        savedArticlesList = savedArticlesList.filter(p => Number(p.id) !== Number(postId));
        document.getElementById('stat-bookmarks-count').innerText = savedArticlesList.length;
        if (savedArticlesList.length === 0) {
          renderBookmarksGrid([]);
        }
      }, 300);
    }
  } catch (err) {
    alert("Không thể gỡ bài viết. Vui lòng thử lại!");
  }
}

/**
 * 5. TAB 2: Lịch sử đọc tin
 */
async function loadUserHistory() {
  const container = document.getElementById('history-container');
  container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">Đang tải lịch sử đọc tin...</div>`;

  try {
    const list = await ApiService.getReadingHistory(0, 30);
    const history = Array.isArray(list) ? list : [];
    document.getElementById('stat-history-count').innerText = history.length;

    if (history.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center space-y-2">
          <svg class="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h4 class="text-xs font-bold text-slate-700">Lịch sử đọc của bạn đang trống</h4>
          <p class="text-[11px] text-slate-400">Khi bạn đọc các bài báo, hệ thống sẽ lưu nhật ký tại đây để bạn tiện theo dõi.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = history.map(post => {
      const cat = post.categoryName || 'Tin tức';
      return `
        <div class="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition group">
          <div class="flex items-center gap-4 min-w-0">
            <span class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
            </span>
            <div class="min-w-0 space-y-1">
              <span class="text-[10px] font-bold uppercase text-blue-600">${cat}</span>
              <h4 class="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate cursor-pointer" onclick="location.href='article-detail.html?slug=${post.slug}'">
                ${post.title}
              </h4>
            </div>
          </div>
          <a href="article-detail.html?slug=${post.slug}" class="shrink-0 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition border border-blue-200">
            Đọc lại
          </a>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi nạp lịch sử:", err);
    container.innerHTML = `<div class="p-8 text-center text-xs text-rose-500">Không thể tải lịch sử đọc tin.</div>`;
  }
}

async function confirmClearHistory() {
  if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử đọc bài không? Hành động này không thể hoàn tác.")) {
    return;
  }

  try {
    await ApiService.clearReadingHistory();
    document.getElementById('stat-history-count').innerText = 0;
    loadUserHistory();
  } catch (err) {
    alert("Không thể xóa lịch sử đọc. Vui lòng thử lại!");
  }
}

/**
 * 6. TAB 3: Chủ đề yêu thích (Topic Preferences)
 */
async function loadUserPreferences() {
  const container = document.getElementById('topics-checkboxes-grid');
  container.innerHTML = `<div class="col-span-full py-6 text-center text-xs text-slate-400">Đang tải danh mục tin tức...</div>`;

  try {
    const [categories, savedPrefs] = await Promise.all([
      ApiService.getCategories(),
      ApiService.getUserPreferences()
    ]);

    allCategoriesList = Array.isArray(categories) ? categories : [];
    userSelectedCategoryIds = Array.isArray(savedPrefs) ? savedPrefs.map(Number) : [];
    document.getElementById('stat-topics-count').innerText = userSelectedCategoryIds.length;

    if (allCategoriesList.length === 0) {
      container.innerHTML = `<div class="col-span-full py-6 text-center text-xs text-slate-400">Không tìm thấy chuyên mục nào.</div>`;
      return;
    }

    container.innerHTML = allCategoriesList.map(cat => {
      const isChecked = userSelectedCategoryIds.includes(Number(cat.id));
      return `
        <label class="topic-pref-card cursor-pointer p-4 rounded-2xl border ${isChecked ? 'bg-blue-50/50 border-blue-500 shadow-xs ring-1 ring-blue-500' : 'bg-white border-slate-200/80'} hover:border-blue-400 transition flex items-start gap-3">
          <input type="checkbox" value="${cat.id}" ${isChecked ? 'checked' : ''} onchange="handleTopicCheckboxChange(this)" class="mt-1 w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500">
          <div class="space-y-0.5">
            <span class="text-xs font-bold text-slate-900 block">${cat.name}</span>
            <p class="text-[11px] text-slate-500 leading-snug">${cat.description || 'Tin tức cập nhật 24/7'}</p>
          </div>
        </label>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi nạp preferences:", err);
    container.innerHTML = `<div class="col-span-full py-6 text-center text-xs text-rose-500">Không thể tải danh sách chuyên mục.</div>`;
  }
}

function handleTopicCheckboxChange(input) {
  const catId = Number(input.value);
  const card = input.closest('.topic-pref-card');
  if (input.checked) {
    if (!userSelectedCategoryIds.includes(catId)) userSelectedCategoryIds.push(catId);
    if (card) {
      card.className = 'topic-pref-card cursor-pointer p-4 rounded-2xl border bg-blue-50/50 border-blue-500 shadow-xs ring-1 ring-blue-500 transition flex items-start gap-3';
    }
  } else {
    userSelectedCategoryIds = userSelectedCategoryIds.filter(id => id !== catId);
    if (card) {
      card.className = 'topic-pref-card cursor-pointer p-4 rounded-2xl border bg-white border-slate-200/80 hover:border-blue-400 transition flex items-start gap-3';
    }
  }
  document.getElementById('stat-topics-count').innerText = userSelectedCategoryIds.length;
}

async function saveSelectedTopics() {
  const feedback = document.getElementById('save-topics-feedback');
  try {
    await ApiService.saveUserPreferences(userSelectedCategoryIds);
    localStorage.setItem('user_topic_preferences', JSON.stringify(userSelectedCategoryIds));
    
    feedback.innerText = 'Đã cập nhật chủ đề yêu thích! Khối "Dành Cho Bạn" trên Trang chủ sẽ hiển thị theo gu đọc mới.';
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 4000);
  } catch (err) {
    alert("Không thể lưu tùy chọn chủ đề. Vui lòng thử lại!");
  }
}

/**
 * 7. TAB 4: Bình luận của tôi
 */
async function loadUserComments() {
  const container = document.getElementById('my-comments-container');
  container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">Đang tải bình luận của bạn...</div>`;

  try {
    const list = await ApiService.getUserComments();
    const comments = Array.isArray(list) ? list : [];
    document.getElementById('stat-comments-count').innerText = comments.length;

    if (comments.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-2">
          <svg class="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          <h4 class="text-xs font-bold text-slate-700">Bạn chưa đăng bình luận nào</h4>
          <p class="text-[11px] text-slate-400">Hãy tham gia thảo luận dưới các bài viết tin tức để đóng góp góc nhìn đa chiều nhé.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = comments.map(c => {
      const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '';
      const postTitle = c.postTitle || 'Bài viết báo chí';
      const postLink = c.postSlug ? `article-detail.html?slug=${c.postSlug}` : `article-detail.html?id=${c.postId}`;

      return `
        <div class="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2.5 shadow-xs">
          <div class="flex items-center justify-between text-xs">
            <span class="text-[11px] font-bold text-blue-600">Bài viết: <a href="${postLink}" class="hover:underline text-slate-900">${postTitle}</a></span>
            <span class="text-[11px] text-slate-400">${dateStr}</span>
          </div>
          <p class="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-serif">
            "${c.content}"
          </p>
          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Trạng thái: <strong class="text-emerald-600 font-semibold">Đã xuất bản công khai</strong></span>
            <a href="${postLink}" class="font-bold text-blue-600 hover:text-blue-700">Xem thảo luận →</a>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi nạp bình luận:", err);
    container.innerHTML = `<div class="p-8 text-center text-xs text-rose-500">Không thể tải danh sách bình luận.</div>`;
  }
}

/**
 * 8. TAB 5: Cập nhật hồ sơ cá nhân
 */
function selectPresetAvatar(url) {
  document.getElementById('input-profile-avatar').value = url;
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const fullName = document.getElementById('input-profile-fullname').value.trim();
  const avatarUrl = document.getElementById('input-profile-avatar').value.trim();
  const msg = document.getElementById('profile-update-msg');

  try {
    const updated = await ApiService.updateProfile({ fullName, avatarUrl });
    if (updated) {
      // Cập nhật localStorage
      const { user } = getAuthData();
      if (user) {
        user.fullName = fullName;
        user.avatarUrl = avatarUrl;
        localStorage.setItem('user', JSON.stringify(user));
      }

      msg.innerText = 'Cập nhật hồ sơ thành công!';
      msg.classList.remove('hidden');
      setTimeout(() => msg.classList.add('hidden'), 3000);

      await loadUserProfile();
    }
  } catch (err) {
    alert("Không thể cập nhật hồ sơ: " + err.message);
  }
}

/**
 * 9. TAB 6: Đổi mật khẩu
 */
async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('input-old-password').value;
  const newPassword = document.getElementById('input-new-password').value;
  const confirmPassword = document.getElementById('input-confirm-password').value;
  const msg = document.getElementById('password-feedback-msg');

  if (newPassword !== confirmPassword) {
    msg.className = 'text-xs font-bold text-rose-600 block';
    msg.innerText = 'Mật khẩu mới và xác nhận mật khẩu không khớp!';
    return;
  }

  try {
    const res = await ApiService.changePassword({ currentPassword, newPassword });
    if (res && res.success) {
      msg.className = 'text-xs font-bold text-emerald-600 block';
      msg.innerText = 'Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.';
      document.getElementById('local-password-form').reset();
    } else {
      msg.className = 'text-xs font-bold text-rose-600 block';
      msg.innerText = res.message || 'Mật khẩu hiện tại không chính xác!';
    }
  } catch (err) {
    msg.className = 'text-xs font-bold text-rose-600 block';
    msg.innerText = err.message;
  }
}

