/**
 * MAIN INTERACTION & DYNAMIC UI RENDERER (100% Dynamic Data từ REST API)
 */

const DEFAULT_PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800';
const EYE_ICON_SVG = `<svg class="eye-icon-svg inline-block shrink-0" viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-7.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/></svg>`;
const BOOKMARK_FILLED_SVG = `<svg class="w-4 h-4 text-blue-600 inline-block" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const BOOKMARK_OUTLINE_SVG = `<svg class="w-4 h-4 text-slate-500 hover:text-blue-600 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const CLOCK_ICON_SVG = `<svg class="w-3.5 h-3.5 inline-block text-slate-400 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initCategoriesNav();
  initLiveSearchAutocomplete();

  if (document.getElementById('spotlight-container')) {
    initHomePage();
  } else if (document.getElementById('category-title')) {
    initCategoryPage();
  } else if (document.getElementById('search-results-summary')) {
    initSearchPage();
  } else if (document.getElementById('article-title')) {
    initArticleDetailPage();
  } else if (document.getElementById('admin-posts-table')) {
    initAdminPage();
  }
});

/* HELPER: DATE FORMATTER */
function formatDate(dateStr) {
  if (!dateStr) return 'Mới đăng';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
}

/* HELPER: HANDLE BROKEN IMAGES WITH DEFAULT PLACEHOLDER */
function handleImgError(img) {
  img.onerror = null;
  img.src = DEFAULT_PLACEHOLDER_IMG;
}

/* DARK MODE TOGGLE */
function initDarkMode() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.body.classList.add('dark-mode');
  }
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      localStorage.setItem('theme', current);
    });
  }
}

/* MOBILE DRAWER TOGGLE */
function toggleMobileDrawer(open) {
  const drawer = document.getElementById('mobile-drawer');
  if (!drawer) return;
  if (open) {
    drawer.classList.remove('hidden');
  } else {
    drawer.classList.add('hidden');
  }
}

/* RENDER CATEGORIES IN HEADER NAV & MOBILE DRAWER WITH ACTIVE STATE HIGHLIGHT */
async function initCategoriesNav() {
  const container = document.getElementById('nav-categories-container');
  const mobileContainer = document.getElementById('mobile-nav-categories');
  const footerContainer = document.getElementById('footer-categories-list');

  const urlParams = new URLSearchParams(window.location.search);
  const currentCategorySlug = urlParams.get('slug') || urlParams.get('id') || '';
  const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

  try {
    let categories = await ApiService.getCategories();
    if (!categories || categories.length === 0) {
      // Fallback danh mục mặc định tiêu chuẩn để Navbar luôn luôn hiển thị
      categories = [
        { id: 1, name: "Thời sự", slug: "thoi-su" },
        { id: 2, name: "Công nghệ", slug: "cong-nghe" },
        { id: 3, name: "Kinh doanh", slug: "kinh-doanh" },
        { id: 4, name: "Giải trí", slug: "giai-tri" },
        { id: 5, name: "AI & Blockchain", slug: "ai-blockchain" },
        { id: 6, name: "Meme", slug: "meme" }
      ];
    }
    if (categories && categories.length > 0) {
      if (container) {
        const homeActive = isHomePage && !currentCategorySlug
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-black pb-1'
          : 'text-slate-700 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition opacity-90 hover:opacity-100';

        const homeLinkHtml = `<a href="index.html" class="px-2.5 sm:px-3 py-1 text-xs uppercase tracking-wider whitespace-nowrap shrink-0 ${homeActive}">Trang Chủ</a>`;

        const categoryLinksHtml = categories.map(cat => {
          const isActive = (currentCategorySlug && (currentCategorySlug === cat.slug || currentCategorySlug == cat.id));
          const activeClasses = isActive 
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-black pb-1' 
            : 'text-slate-700 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition opacity-90 hover:opacity-100';
          return `<a href="category.html?slug=${cat.slug}&id=${cat.id}" class="px-2.5 sm:px-3 py-1 text-xs uppercase tracking-wider whitespace-nowrap shrink-0 ${activeClasses}">${cat.name}</a>`;
        }).join('');

        container.innerHTML = homeLinkHtml + categoryLinksHtml;
      }

      if (mobileContainer) {
        const homeStyle = isHomePage && !currentCategorySlug ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100';
        const mobileHomeHtml = `<a href="index.html" class="px-3 py-2 rounded-lg text-sm font-medium ${homeStyle}">Trang Chủ</a>`;

        const mobileCategoryHtml = categories.map(cat => {
          const isActive = (currentCategorySlug && (currentCategorySlug === cat.slug || currentCategorySlug == cat.id));
          const activeStyle = isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100';
          return `<a href="category.html?slug=${cat.slug}&id=${cat.id}" class="px-3 py-2 rounded-lg text-sm font-medium ${activeStyle}">${cat.name}</a>`;
        }).join('');

        mobileContainer.innerHTML = mobileHomeHtml + mobileCategoryHtml;
      }

      if (footerContainer) {
        footerContainer.innerHTML = `
          <li><a href="index.html" class="hover:text-white transition">Trang chủ</a></li>
          ${categories.slice(0, 5).map(cat => `<li><a href="category.html?slug=${cat.slug}&id=${cat.id}" class="hover:text-white transition">${cat.name}</a></li>`).join('')}
        `;
      }
    }
  } catch (err) {
    console.error("Lỗi nạp danh mục:", err);
  }
}

/* SKELETON LOADING RENDERER */
function renderSkeletonFeed(containerId, count = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let skeletonHtml = '';
  for (let i = 0; i < count; i++) {
    skeletonHtml += `
      <div class="flex flex-col md:flex-row gap-5 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
        <div class="skeleton-box w-full md:w-56 h-40 rounded-lg"></div>
        <div class="flex flex-col justify-between flex-1 space-y-3">
          <div class="space-y-2">
            <div class="skeleton-box h-4 w-24"></div>
            <div class="skeleton-box h-6 w-full"></div>
            <div class="skeleton-box h-4 w-4/5"></div>
          </div>
          <div class="skeleton-box h-4 w-36"></div>
        </div>
      </div>
    `;
  }
  container.innerHTML = skeletonHtml;
}

/* HOMEPAGE LOGIC */
async function initHomePage() {
  renderSkeletonFeed('latest-feed-container', 3);
  try {
    loadPublicBanners();
    renderHomeActivePoll();

    const data = await ApiService.getHomepageNews();
    let categories = [];
    try {
      categories = await ApiService.getCategories();
    } catch (e) {
      console.warn("Không thể tải danh mục cho khối nổi bật:", e);
    }

    const latestList = data.latest || [];
    const spotlightList = data.spotlight || [];
    const trendingList = data.trending || [];

    renderSpotlight(spotlightList, latestList);
    renderForYouRecommendations();
    renderLatestFeed(latestList);
    renderFeaturedCategories(categories, latestList);
    renderTrending(trendingList);
  } catch (err) {
    console.error("Lỗi nạp dữ liệu trang chủ:", err);
  }
}

/* PHÂN KHU 1: HERO SPOTLIGHT (TỶ LỆ 65% / 35%) */
function renderSpotlight(spotlightPosts = [], fallbackPosts = []) {
  const container = document.getElementById('spotlight-container');
  if (!container) return;

  const combined = [...spotlightPosts, ...fallbackPosts];
  const uniqueMap = new Map();
  combined.forEach(p => { if (p && p.id && !uniqueMap.has(p.id)) uniqueMap.set(p.id, p); });
  const allPosts = Array.from(uniqueMap.values());

  if (allPosts.length === 0) {
    container.innerHTML = `<div class="lg:col-span-12 text-center py-10 text-slate-400">Chưa có bài viết Spotlight nào.</div>`;
    return;
  }

  const hero = allPosts[0];
  const sidePosts = allPosts.slice(1, 3);
  const heroImg = hero.thumbnailUrl || DEFAULT_PLACEHOLDER_IMG;
  const heroReadTime = hero.readingTime ? `${hero.readingTime} phút đọc` : calculateReadingTime((hero.sapo || '') + ' ' + (hero.content || ''));
  const heroRelTime = formatRelativeTime(hero.publishedAt);
  const heroByline = hero.byline || hero.authorName || 'Tòa soạn';

  const heroSeriesBadge = hero.seriesName
    ? `<span class="inline-block bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">Tuyến: ${hero.seriesName} (Kỳ ${hero.seriesOrder || 1})</span>`
    : '';

  const heroFormatBadge = (hero.postFormat && hero.postFormat !== 'STANDARD')
    ? `<span class="inline-block bg-indigo-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide">${hero.postFormat}</span>`
    : '';

  container.innerHTML = `
    <!-- CỘT TRÁI (TIN SPOTLIGHT CHÍNH - 65% / 8 COLS) -->
    <div class="lg:col-span-8 news-card-hover group relative overflow-hidden rounded-2xl bg-slate-950 text-white shadow-md border border-slate-200/60 dark:border-slate-700/80 cursor-pointer h-[380px] sm:h-[440px] lg:h-[460px] flex flex-col justify-end" onclick="location.href='article-detail.html?slug=${hero.slug}'">
      <img src="${heroImg}" fetchpriority="high" decoding="async" onerror="handleImgError(this)" alt="${hero.title}" class="news-img-zoom absolute inset-0 w-full h-full object-cover opacity-85">
      <div class="hero-gradient-overlay absolute inset-0"></div>
      
      <div class="relative z-10 p-5 sm:p-7 space-y-2.5">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-block bg-red-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-md tracking-wider shadow-xs">
            ${hero.categoryName || 'Tiêu Điểm'}
          </span>
          ${heroFormatBadge}
          ${heroSeriesBadge}
          <span class="text-xs text-slate-300 font-medium">${heroRelTime}</span>
        </div>

        <h2 class="font-serif text-xl sm:text-2xl lg:text-3xl font-bold leading-tight text-white group-hover:text-blue-200 transition line-clamp-2 sm:line-clamp-3">
          ${hero.title}
        </h2>

        <p class="text-slate-200 text-xs sm:text-sm line-clamp-2 leading-relaxed max-w-2xl">
          ${hero.sapo || ''}
        </p>

        <div class="flex items-center gap-4 text-xs text-slate-300 pt-1 border-t border-white/15 flex-wrap">
          <span>Bút danh: <strong class="text-white">${heroByline}</strong></span>
          <span>•</span>
          <span class="inline-flex items-center gap-1">${EYE_ICON_SVG} <span>${hero.viewsCount || 0} lượt xem</span></span>
          <span>•</span>
          <span class="text-blue-300 font-semibold">${heroReadTime}</span>
        </div>
      </div>
    </div>

    <!-- CỘT PHẢI (CỤM SUB-SPOTLIGHT - 35% / 4 COLS) -->
    <div class="lg:col-span-4 flex flex-col gap-4 justify-between">
      ${sidePosts.map(post => {
        const sideImg = post.thumbnailUrl || DEFAULT_PLACEHOLDER_IMG;
        const sideRelTime = formatRelativeTime(post.publishedAt);
        const sideByline = post.byline || post.authorName || 'Tòa soạn';
        const sideSeriesBadge = post.seriesName ? `<span class="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold">Kỳ ${post.seriesOrder || 1}</span>` : '';
        return `
        <div class="news-card-hover group flex gap-3.5 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition cursor-pointer flex-1" onclick="location.href='article-detail.html?slug=${post.slug}'">
          <div class="w-28 sm:w-32 h-24 sm:h-26 rounded-xl overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700">
            <img src="${sideImg}" loading="lazy" decoding="async" onerror="handleImgError(this)" class="news-img-zoom w-full h-full object-cover" alt="${post.title}">
          </div>
          <div class="flex flex-col justify-between flex-1 min-w-0">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">${post.categoryName || 'Tin tức'}</span>
                ${sideSeriesBadge}
              </div>
              <h3 class="font-serif text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug mt-1">
                ${post.title}
              </h3>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-700/60 pt-1.5">
              <span>${sideByline}</span>
              <span class="inline-flex items-center gap-1">${EYE_ICON_SVG} <span>${post.viewsCount || 0}</span></span>
            </div>
          </div>
        </div>
      `;
      }).join('')}
    </div>
  `;
}

/* PHÂN KHU 2: DÒNG TIN MỚI NHẤT (MAIN STREAM FEED) */
function renderLatestFeed(posts, emptyMessage = 'Chưa có bài viết mới.') {
  const container = document.getElementById('latest-feed-container');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-xs">
        <div class="w-12 h-12 mx-auto mb-3 text-slate-300">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
        </div>
        <h3 class="font-serif text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Không tìm thấy nội dung</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">${emptyMessage}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = posts.map(post => {
    const imgUrl = post.thumbnailUrl || DEFAULT_PLACEHOLDER_IMG;
    const relTime = formatRelativeTime(post.publishedAt);
    const readTime = post.readingTime ? `${post.readingTime} phút đọc` : calculateReadingTime((post.sapo || '') + ' ' + (post.content || ''));
    const byline = post.byline || post.authorName || 'Tòa soạn';
    const seriesBadge = post.seriesName ? `<span class="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded font-bold">Tuyến: ${post.seriesName} (Kỳ ${post.seriesOrder || 1})</span>` : '';
    const formatBadge = (post.postFormat && post.postFormat !== 'STANDARD') ? `<span class="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded font-extrabold uppercase">${post.postFormat}</span>` : '';

    return `
    <article class="news-card-hover group flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 hover:shadow-md transition cursor-pointer" onclick="location.href='article-detail.html?slug=${post.slug}'">
      <div class="w-full sm:w-52 md:w-56 h-40 rounded-xl overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700">
        <img src="${imgUrl}" loading="lazy" decoding="async" onerror="handleImgError(this)" class="news-img-zoom w-full h-full object-cover" alt="${post.title}">
      </div>
      <div class="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-md uppercase tracking-wider">${post.categoryName || 'Tin tức'}</span>
            ${formatBadge}
            ${seriesBadge}
            <span class="text-xs text-slate-400 font-medium">• ${relTime}</span>
          </div>
          <h3 class="font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 mb-1.5 leading-snug">
            ${post.title}
          </h3>
          <p class="text-slate-600 dark:text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3">
            ${post.sapo || ''}
          </p>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
          <span>Bút danh: <strong class="text-slate-800 dark:text-slate-200">${byline}</strong></span>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1">${EYE_ICON_SVG} <span>${post.viewsCount || 0} lượt xem</span></span>
            <span class="text-blue-600 dark:text-blue-400 font-medium">${readTime}</span>
          </div>
        </div>
      </div>
    </article>
  `;
  }).join('');
}

/* PHÂN KHU 3: KHỐI CHUYÊN MỤC NỔI BẬT (FEATURED CATEGORIES GRID 2 CỘT) */
function renderFeaturedCategories(categories, allPosts) {
  const container = document.getElementById('featured-categories-container');
  if (!container) return;

  if (!categories || categories.length === 0 || !allPosts || allPosts.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 col-span-2">Đang nạp chuyên mục nổi bật...</p>`;
    return;
  }

  // Nhóm các bài viết theo chuyên mục
  let catBlocks = categories.map(cat => {
    const catPosts = allPosts.filter(p => p.categorySlug === cat.slug || p.categoryName === cat.name || p.categoryId == cat.id);
    return {
      category: cat,
      posts: catPosts
    };
  }).filter(block => block.posts.length > 0).slice(0, 4);

  if (catBlocks.length === 0) {
    const mid = Math.ceil(allPosts.length / 2);
    catBlocks = [
      { category: { name: 'Thời Sự & Xã Hội', slug: 'thoi-su' }, posts: allPosts.slice(0, mid) },
      { category: { name: 'Công Nghệ & Đổi Mới', slug: 'cong-nghe' }, posts: allPosts.slice(mid) }
    ].filter(b => b.posts.length > 0);
  }

  container.innerHTML = catBlocks.map(block => {
    const cat = block.category;
    const leadPost = block.posts[0];
    const subPosts = block.posts.slice(1, 4);
    const leadImg = leadPost.thumbnailUrl || DEFAULT_PLACEHOLDER_IMG;
    const leadRelTime = formatRelativeTime(leadPost.publishedAt);

    return `
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
        <div>
          <!-- Header Chuyên mục -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-2.5 mb-4">
            <h3 class="font-serif text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span class="w-2 h-4 bg-blue-600 rounded-xs"></span>
              ${cat.name}
            </h3>
            <a href="category.html?slug=${cat.slug}" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Xem tất cả →
            </a>
          </div>

          <!-- Bài Lead chính của Chuyên mục -->
          <div class="group cursor-pointer mb-4" onclick="location.href='article-detail.html?slug=${leadPost.slug}'">
            <div class="w-full h-44 rounded-xl overflow-hidden mb-3 border border-slate-200/60 dark:border-slate-700">
              <img src="${leadImg}" loading="lazy" decoding="async" onerror="handleImgError(this)" class="news-img-zoom w-full h-full object-cover" alt="${leadPost.title}">
            </div>
            <h4 class="font-serif text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug line-clamp-2 mb-1.5">
              ${leadPost.title}
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
              ${leadPost.sapo || ''}
            </p>
            <span class="text-[11px] text-slate-400">${leadRelTime}</span>
          </div>

          <!-- Các bài phụ thu nhỏ -->
          ${subPosts.length > 0 ? `
            <div class="border-t border-slate-100 dark:border-slate-700/70 pt-3 space-y-2.5">
              ${subPosts.map(sub => `
                <div class="group flex items-start gap-2.5 cursor-pointer" onclick="location.href='article-detail.html?slug=${sub.slug}'">
                  <span class="text-blue-600 dark:text-blue-400 text-xs font-black mt-0.5">•</span>
                  <div class="flex-1 min-w-0">
                    <h5 class="font-serif text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 leading-snug">
                      ${sub.title}
                    </h5>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/* PHÂN KHU 4: WIDGET ĐỌC NHIỀU NHẤT (TRENDING TOP VIEWS) */
function renderTrending(posts) {
  const container = document.getElementById('trending-container');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Đang cập nhật danh sách bài đọc nhiều...</p>`;
    return;
  }

  const getRankBadgeClass = (idx) => {
    if (idx === 0) return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xs';
    if (idx === 1) return 'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-xs';
    if (idx === 2) return 'bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-xs';
    return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold';
  };

  container.innerHTML = posts.map((post, idx) => `
    <div class="group flex items-start gap-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-700/60 last:border-0 last:pb-0 cursor-pointer" onclick="location.href='article-detail.html?slug=${post.slug}'">
      <span class="w-7 h-7 rounded-full ${getRankBadgeClass(idx)} flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
        ${idx + 1}
      </span>
      <div class="flex-1 min-w-0">
        <h4 class="font-serif text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
          ${post.title}
        </h4>
        <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
          <span class="font-semibold text-blue-600 dark:text-blue-400">${post.categoryName || 'Tin tức'}</span>
          <span>•</span>
          <span class="inline-flex items-center gap-1">${EYE_ICON_SVG} <span>${post.viewsCount || 0}</span></span>
        </div>
      </div>
    </div>
  `).join('');
}


/* CATEGORY PAGE LOGIC */
async function initCategoryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug') || urlParams.get('id') || '';

  const titleEl = document.getElementById('category-title');
  const descEl = document.getElementById('category-desc');

  renderSkeletonFeed('latest-feed-container', 4);

  try {
    const categories = await ApiService.getCategories();
    const currentCat = categories.find(c => c.slug === slug || c.id == slug);

    if (currentCat) {
      if (titleEl) titleEl.innerText = `Chuyên mục: ${currentCat.name}`;
      if (descEl) descEl.innerText = currentCat.description || `Cập nhật những tin tức bài viết mới nhất thuộc chuyên mục ${currentCat.name}.`;
      document.title = `${currentCat.name} — The News Portal`;
    } else {
      if (titleEl) titleEl.innerText = `Chuyên mục tin tức`;
      if (descEl) descEl.innerText = `Tổng hợp tất cả bài viết theo chuyên mục.`;
    }

    const posts = await ApiService.getPostsByCategory(slug);
    renderLatestFeed(posts, `Hiện chưa có bài viết nào trong chuyên mục này.`);

    // Nạp thêm tin nổi bật / đọc nhiều nhất ở sidebar
    const homepageData = await ApiService.getHomepageNews();
    renderTrending(homepageData.trending || []);

  } catch (err) {
    console.error("Lỗi nạp bài viết chuyên mục:", err);
    renderLatestFeed([], `Lỗi nạp danh sách bài viết chuyên mục.`);
  }
}

/* SEARCH PAGE LOGIC */
async function initSearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q') || urlParams.get('search') || '';

  const summaryEl = document.getElementById('search-results-summary');
  const inputEl = document.getElementById('search-input-field');
  if (inputEl) inputEl.value = query;

  if (!query.trim()) {
    if (summaryEl) summaryEl.innerHTML = `Vui lòng nhập từ khóa để tìm kiếm bài viết.`;
    renderLatestFeed([], `Chưa nhập từ khóa tìm kiếm.`);
    return;
  }

  if (summaryEl) summaryEl.innerHTML = `Đang tìm kiếm bài viết cho từ khóa: <strong class="text-slate-900 dark:text-slate-100">"${query}"</strong>...`;
  renderSkeletonFeed('latest-feed-container', 4);

  try {
    const posts = await ApiService.searchPosts(query);
    if (summaryEl) {
      summaryEl.innerHTML = `Tìm thấy <strong class="text-blue-600 dark:text-blue-400">${posts.length}</strong> kết quả phù hợp với từ khóa: <strong class="text-slate-900 dark:text-slate-100">"${query}"</strong>`;
    }
    renderLatestFeed(posts, `Không tìm thấy bài viết nào phù hợp với từ khóa "${query}". Vui lòng thử lại với từ khóa khác.`);
  } catch (err) {
    console.error("Lỗi tìm kiếm bài viết:", err);
    if (summaryEl) summaryEl.innerHTML = `Không thể thực hiện tìm kiếm bài viết lúc này.`;
    renderLatestFeed([], `Xảy ra lỗi kết nối khi tìm kiếm bài viết.`);
  }
}

/* READING PROGRESS BAR & TOAST HELPERS */
function initReadingProgressBar() {
  const progressBar = document.getElementById('reading-progress-bar');
  if (!progressBar) return;
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = (window.scrollY / totalHeight) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
  });
}

function calculateReadingTime(htmlContent) {
  if (!htmlContent) return '1 phút đọc';

  // 1. Tạo thẻ div ảo để bóc tách lấy thuần văn bản (bỏ toàn bộ thẻ HTML <img>, <p>, <div>...)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const textOnly = tempDiv.textContent || tempDiv.innerText || '';

  // 2. Tách từ bằng khoảng trắng và đếm tổng số từ
  const words = textOnly.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // 3. Tính số phút (mặc định tối thiểu là 1 phút, tốc độ chuẩn 200 từ/phút)
  const wordsPerMinute = 200;
  const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  return `${readingTime} phút đọc`;
}

function copyArticleLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToastNotification('Đã sao chép liên kết bài viết!');
  }).catch(() => {
    showToastNotification('Đã sao chép liên kết!');
  });
}

function showToastNotification(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) return;
  if (message) toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

/* ARTICLE DETAIL LOGIC */
let currentArticlePostId = null;

async function initArticleDetailPage() {
  initReadingProgressBar();

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) return;

  let currentCategorySlug = null;

  try {
    loadPublicBanners();

    // Khóa chống spam tăng view ảo khi người đọc đổi ngôn ngữ EN/VI hoặc tải lại trang
    const sessionViewKey = 'newsportal_viewed_' + slug;
    const isAlreadyViewed = sessionStorage.getItem(sessionViewKey) === 'true';

    const post = await ApiService.getPostBySlug(slug, !isAlreadyViewed);
    sessionStorage.setItem(sessionViewKey, 'true');
    if (!post) return;
    currentArticlePostId = post.id;
    window.currentPostId = post.id;
    currentCategorySlug = post.categorySlug;

    document.getElementById('article-breadcrumb-category').innerText = post.categoryName || 'Tin tức';
    document.getElementById('article-title').innerText = post.title;
    document.getElementById('article-sapo').innerText = post.sapo || '';
    
    // Byline / Bút danh phóng viên
    const bylineStr = post.byline ? `${post.byline} ${post.authorName ? '(@' + post.authorName + ')' : ''}` : (post.authorName || 'Tòa soạn');
    document.getElementById('article-author').innerText = bylineStr;
    document.getElementById('article-date').innerText = formatDate(post.publishedAt);
    
    const viewsEl = document.getElementById('article-views');
    if (viewsEl) {
      viewsEl.innerHTML = `${EYE_ICON_SVG} <span>${post.viewsCount || 0} lượt xem</span>`;
    }

    // Thời gian đọc
    const readingTimeEl = document.getElementById('article-reading-time');
    if (readingTimeEl) {
      readingTimeEl.innerText = post.readingTime ? `${post.readingTime} phút đọc` : calculateReadingTime((post.sapo || '') + ' ' + (post.content || ''));
    }

    // Lead Photo & Bản quyền ảnh
    const leadFigure = document.getElementById('article-lead-figure');
    const leadImg = document.getElementById('article-lead-img');
    const leadCredit = document.getElementById('article-lead-credit');
    if (leadFigure && leadImg && post.thumbnailUrl) {
      leadImg.src = post.thumbnailUrl;
      if (leadCredit) {
        leadCredit.innerText = post.thumbnailCredit ? `Ảnh: ${post.thumbnailCredit}` : 'Ảnh phóng sự tòa soạn';
      }
      leadFigure.classList.remove('hidden');
    }
    
    // Clean HTML Content: loại bỏ contenteditable & class editor admin để đảm bảo Read-Only 100%
    const cleanContainer = document.createElement('div');
    cleanContainer.innerHTML = post.content || '';
    cleanContainer.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    cleanContainer.querySelectorAll('.active-selected-img').forEach(el => el.classList.remove('active-selected-img'));
    document.getElementById('article-content').innerHTML = cleanContainer.innerHTML;

    // Ghi nhận lịch sử đọc bài viết & cập nhật nút Bookmark
    recordArticleRead(currentArticlePostId, post.category ? post.category.id : null);
    checkAndUpdateBookmarkButton(currentArticlePostId);

    // Hiển thị hộp Tuyến Bài Phóng Sự Dài Kỳ (nếu có)
    renderArticleSeriesBox(post);

    // Hiển thị Khảo Sát / Bình Chọn Độc Giả (nếu có)
    renderArticlePoll(currentArticlePostId);

    // Nạp bài viết liên quan cùng chuyên mục
    if (currentCategorySlug) {
      loadRelatedPosts(currentCategorySlug, currentArticlePostId);
    }

    // Hiển thị khung bình luận dựa trên trạng thái Đăng nhập
    renderArticleCommentSection(post);

    loadArticleComments(currentArticlePostId);
  } catch (err) {
    console.error("Lỗi nạp bài viết:", err);
  }
}

function renderArticleCommentSection(post) {
  const container = document.getElementById('comment-form-container');
  if (!container) return;

  if (post && post.allowComments === false) {
    container.innerHTML = `
      <div class="p-4 bg-amber-50 text-amber-800 rounded-2xl text-xs font-semibold border border-amber-200 flex items-center gap-2">
        <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        <span>Tác giả / Tòa soạn đã tắt tính năng bình luận cho bài viết này.</span>
      </div>
    `;
    return;
  }

  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch (e) {}
  }

  // Trường hợp 1: KHÁCH TRUY CẬP (GUEST / Chưa đăng nhập)
  if (!token || !user) {
    container.innerHTML = `
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
        <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        </div>
        <div>
          <h4 class="text-sm sm:text-base font-black text-slate-900">Đăng nhập để tham gia bình luận</h4>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Vui lòng đăng nhập hoặc đăng ký tài khoản THE NEWS PORTAL để chia sẻ ý kiến của bạn về bài viết này.
          </p>
        </div>
        <div class="flex items-center justify-center gap-3 pt-2">
          <button type="button" onclick="handleCommentLoginClick()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer">
            <span>Đăng nhập ngay</span>
          </button>
          <button type="button" onclick="handleCommentRegisterClick()" class="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer">
            <span>Đăng ký tài khoản</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Trường hợp 2: ĐỘC GIẢ ĐÃ ĐĂNG NHẬP
  const displayName = user.fullName || user.username || 'Độc giả';
  const displayEmail = user.email || '';
  const initialChar = (user.username || 'U').charAt(0).toUpperCase();

  container.innerHTML = `
    <div class="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200/80 mb-8 space-y-3">
      <!-- User info header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200/70 text-xs">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
            ${initialChar}
          </div>
          <div>
            <div class="flex items-center gap-1.5 font-extrabold text-slate-900">
              <span>${displayName}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">Đã đăng nhập</span>
            </div>
            <span class="text-[11px] text-slate-400">${displayEmail}</span>
          </div>
        </div>
      </div>

      <!-- Main comment form -->
      <form id="comment-form" class="space-y-3">
        <div>
          <label for="comment-content" class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Nội dung bình luận <span class="text-rose-500">* (5 - 1000 ký tự)</span></label>
          <textarea id="comment-content" required rows="3" minlength="5" maxlength="1000" placeholder="Chia sẻ quan điểm, suy nghĩ của bạn về bài viết..." class="w-full p-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 transition resize-none"></textarea>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-[11px] text-slate-400">Tối thiểu 5 ký tự • Hiển thị tức thì</span>
          <button type="submit" id="submit-comment-btn" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer">
            <span>Gửi bình luận</span>
            <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>
      </form>
    </div>
  `;

  // Gắn sự kiện submit cho form
  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  const contentInput = document.getElementById('comment-content');
  const submitBtn = document.getElementById('submit-comment-btn');

  const content = contentInput ? contentInput.value.trim() : '';
  const targetPostId = currentArticlePostId || window.currentPostId;

  if (!targetPostId) {
    alert("Không xác định được bài viết!");
    return;
  }

  if (!content || content.length < 5) {
    alert("Vui lòng nhập nội dung bình luận tối thiểu 5 ký tự!");
    return;
  }

  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Gửi bình luận';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Đang gửi...</span>';
  }

  try {
    await ApiService.addComment(targetPostId, { content, parentId: null });
    if (contentInput) contentInput.value = '';

    await loadArticleComments(targetPostId);

    if (typeof showToastNotification === 'function') {
      showToastNotification("Bình luận của bạn đã được đăng thành công!");
    } else {
      alert("Bình luận của bạn đã được đăng thành công!");
    }
  } catch (err) {
    if (err.message && (err.message.includes('401') || err.message.includes('đăng nhập'))) {
      alert("Vui lòng đăng nhập để bình luận!");
      if (typeof openAuthModal === 'function') openAuthModal('login');
    } else {
      alert(err.message || "Lỗi khi gửi bình luận. Vui lòng thử lại!");
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

window.handleCommentLoginClick = function() {
  if (typeof openAuthModal === 'function') {
    openAuthModal('login');
  } else {
    window.location.href = 'index.html?auth=login';
  }
};

window.handleCommentRegisterClick = function() {
  if (typeof openAuthModal === 'function') {
    openAuthModal('register');
  } else {
    window.location.href = 'index.html?auth=register';
  }
};

async function loadRelatedPosts(categorySlug, currentPostId) {
  const container = document.getElementById('related-posts-container');
  if (!container) return;

  try {
    let related = await ApiService.getSmartRelatedPosts(currentPostId, 3);
    if (!related || related.length === 0) {
      const posts = await ApiService.getPostsByCategory(categorySlug);
      related = (posts || []).filter(p => p.id !== currentPostId).slice(0, 3);
    }

    if (related.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 col-span-3">Chưa có bài viết gợi ý thêm.</p>`;
      return;
    }

    container.innerHTML = related.map(post => {
      const imgUrl = post.thumbnailUrl || DEFAULT_PLACEHOLDER_IMG;
      return `
        <div class="flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700 hover:shadow-md transition cursor-pointer" onclick="location.href='article-detail.html?slug=${post.slug}'">
          <img src="${imgUrl}" loading="lazy" decoding="async" onerror="handleImgError(this)" class="w-full h-36 object-cover" alt="${post.title}">
          <div class="p-4 flex flex-col justify-between flex-1 space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">${post.categoryName || 'Tin tức'}</span>
            <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-blue-600 transition leading-snug">${post.title}</h4>
            <span class="text-[11px] text-slate-400 mt-auto pt-2">${formatDate(post.publishedAt)}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi nạp bài viết liên quan:", err);
  }
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'Vừa xong';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Vừa xong';
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return formatDate(dateString);
  } catch (e) {
    return 'Vừa xong';
  }
}

function getAvatarBgColor(name) {
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getAvatarInitials(name) {
  if (!name) return 'DG';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function loadArticleComments(postId) {
  const container = document.getElementById('comments-list-container');
  const countBadge = document.getElementById('comments-count-badge');
  if (!container) return;

  try {
    const comments = await ApiService.getPostComments(postId);
    
    // Đếm tổng số lượng cả root và replies
    let totalCount = 0;
    if (comments && Array.isArray(comments)) {
      comments.forEach(c => {
        totalCount += 1;
        if (c.replies && Array.isArray(c.replies)) {
          totalCount += c.replies.length;
        }
      });
    }

    if (countBadge) countBadge.innerText = totalCount;

    if (!comments || comments.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <svg class="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          <p class="text-xs font-semibold text-slate-500">Chưa có bình luận nào cho bài viết này.</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Hãy là người đầu tiên chia sẻ góc nhìn của bạn!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = comments.map(c => renderCommentCard(c, false)).join('');
  } catch (err) {
    console.error("Lỗi nạp bình luận:", err);
    container.innerHTML = '<p class="text-xs text-rose-500 py-4 text-center">Không thể tải bình luận. Vui lòng thử lại sau.</p>';
  }
}

function renderCommentCard(c, isReply = false) {
  const initials = getAvatarInitials(c.userName);
  const avatarBg = getAvatarBgColor(c.userName);
  const timeStr = formatRelativeTime(c.createdAt);

  const hasReplies = c.replies && Array.isArray(c.replies) && c.replies.length > 0;
  const repliesHtml = hasReplies 
    ? `<div class="mt-3 pl-4 border-l-2 border-slate-200 space-y-3">${c.replies.map(r => renderCommentCard(r, true)).join('')}</div>`
    : '';

  return `
    <div id="comment-card-${c.id}" class="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition space-y-2.5">
      <!-- Comment Author & Meta -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full ${avatarBg} text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
            ${initials}
          </div>
          <div>
            <div class="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>${c.userName || 'Độc giả'}</span>
              ${isReply ? '<span class="text-[10px] font-normal text-slate-400">• Đã trả lời</span>' : ''}
            </div>
            <span class="text-[11px] text-slate-400">${timeStr}</span>
          </div>
        </div>

        ${!isReply ? `
        <button onclick="toggleReplyBox(${c.id}, '${(c.userName || 'Độc giả').replace(/'/g, "\\'")}')" class="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1 cursor-pointer">
          <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
          <span>Trả lời</span>
        </button>
        ` : ''}
      </div>

      <!-- Comment Content -->
      <p class="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line pl-10">${c.content}</p>

      <!-- Reply Box Container -->
      <div id="reply-box-container-${c.id}" class="hidden pl-10 pt-2"></div>

      <!-- Nested Replies -->
      ${repliesHtml}
    </div>
  `;
}

window.toggleReplyBox = function(parentId, authorName) {
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch (e) {}
  }

  if (!token || !user) {
    if (typeof showToastNotification === 'function') {
      showToastNotification("Vui lòng đăng nhập để trả lời bình luận!");
    }
    if (typeof openAuthModal === 'function') {
      openAuthModal('login');
    } else {
      alert("Vui lòng đăng nhập để trả lời bình luận!");
    }
    return;
  }

  const container = document.getElementById(`reply-box-container-${parentId}`);
  if (!container) return;

  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  const displayName = user.fullName || user.username || 'Độc giả';

  container.classList.remove('hidden');
  container.innerHTML = `
    <form onsubmit="submitReplyComment(event, ${parentId})" class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 mt-2">
      <div class="flex items-center justify-between text-[11px] font-bold text-slate-600">
        <span>Trả lời <strong>@${authorName}</strong> <span class="text-slate-400 font-normal">với tư cách ${displayName}</span></span>
        <button type="button" onclick="toggleReplyBox(${parentId})" class="p-1 text-slate-400 hover:text-slate-600" aria-label="Đóng">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <textarea id="reply-content-${parentId}" required rows="2" minlength="5" maxlength="1000" placeholder="Viết phản hồi của bạn (5 - 1000 ký tự)..." class="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 transition resize-none"></textarea>

      <div class="flex justify-end gap-2 pt-1">
        <button type="button" onclick="toggleReplyBox(${parentId})" class="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">Hủy</button>
        <button type="submit" id="reply-submit-btn-${parentId}" class="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer">
          <span>Gửi trả lời</span>
          <svg class="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
      </div>
    </form>
  `;

  setTimeout(() => {
    const input = document.getElementById(`reply-content-${parentId}`);
    if (input) input.focus();
  }, 100);
};

window.submitReplyComment = async function(e, parentId) {
  e.preventDefault();
  const targetPostId = currentArticlePostId || window.currentPostId;
  if (!targetPostId) {
    alert("Không xác định được bài viết!");
    return;
  }

  const contentInput = document.getElementById(`reply-content-${parentId}`);
  const submitBtn = document.getElementById(`reply-submit-btn-${parentId}`);

  const content = contentInput ? contentInput.value.trim() : '';

  if (!content || content.length < 5) {
    alert("Vui lòng nhập nội dung phản hồi tối thiểu 5 ký tự!");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Đang gửi...</span>';
  }

  try {
    await ApiService.addComment(targetPostId, { content, parentId });
    // Tải lại ngay lập tức
    await loadArticleComments(targetPostId);
    if (typeof showToastNotification === 'function') {
      showToastNotification("Đã gửi câu trả lời thành công!");
    }
  } catch (err) {
    if (err.message && (err.message.includes('401') || err.message.includes('đăng nhập'))) {
      alert("Vui lòng đăng nhập để trả lời bình luận!");
      if (typeof openAuthModal === 'function') openAuthModal('login');
    } else {
      alert(err.message || "Lỗi khi gửi phản hồi!");
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Gửi trả lời</span>';
    }
  }
};

window.loadComments = loadArticleComments;
window.loadArticleComments = loadArticleComments;

/* ADMIN CMS LOGIC */
async function initAdminPage() {
  loadAdminPosts();

  try {
    const stats = await ApiService.getAdminStats();
    if (stats) {
      document.getElementById('total-posts-count').innerText = stats.totalPosts || 0;
    }
  } catch (err) {
    console.error("Lỗi nạp thống kê dashboard:", err);
  }

  const createForm = document.getElementById('admin-create-post-form');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPost = {
        title: document.getElementById('post-title').value,
        sapo: document.getElementById('post-sapo').value,
        categorySlug: document.getElementById('post-category').value.toLowerCase(),
        thumbnailUrl: document.getElementById('post-thumbnail').value || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600",
        content: document.getElementById('post-content-editor').value,
        status: "PUBLISHED"
      };

      await ApiService.createPost(newPost);
      alert("Đã xuất bản bài viết thành công vào Database!");
      createForm.reset();
      loadAdminPosts();
    });
  }
}

async function loadAdminPosts() {
  const tableBody = document.getElementById('admin-posts-table');
  if (!tableBody) return;

  try {
    const posts = await ApiService.getAdminPosts();
    tableBody.innerHTML = posts.map(post => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="p-3 text-sm font-semibold text-gray-900 max-w-xs truncate">${post.title}</td>
        <td class="p-3 text-sm text-gray-600">${post.categoryName || '-'}</td>
        <td class="p-3 text-sm text-gray-600">${post.authorName || 'Admin'}</td>
        <td class="p-3 text-sm">
          <span class="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">${post.status}</span>
        </td>
        <td class="p-3 text-sm text-gray-500">${formatDate(post.publishedAt)}</td>
        <td class="p-3 text-sm">
          <button onclick="handleDeletePost(${post.id})" class="text-red-600 hover:text-red-800 font-semibold transition">Xóa</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error("Lỗi nạp bài viết admin:", err);
  }
}

/* ========================================================
 * LIVE SEARCH AUTOCOMPLETE DROPDOWN
 * ======================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightKeyword(text, keyword) {
  if (!text) return '';
  if (!keyword || !keyword.trim()) return escapeHtml(text);
  const safeText = escapeHtml(text);
  const safeKeyword = escapeHtml(keyword.trim());
  const escaped = safeKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return safeText.replace(regex, '<span class="text-blue-600 dark:text-blue-400 font-black underline decoration-blue-500/40">$1</span>');
}

function initLiveSearchAutocomplete() {
  const searchInputs = document.querySelectorAll('input[name="q"], input[name="search"], #search-input, #search-input-field');
  if (!searchInputs || searchInputs.length === 0) return;

  searchInputs.forEach(input => {
    if (input.dataset.autocompleteBound) return;
    input.dataset.autocompleteBound = 'true';

    // Đảm bảo phần tử bọc input có position relative
    const parent = input.closest('.relative') || input.parentElement;
    if (parent && !parent.classList.contains('relative')) {
      parent.classList.add('relative');
    }

    // Khởi tạo container dropdown
    let dropdown = parent ? parent.querySelector('.live-search-dropdown') : null;
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'live-search-dropdown hidden absolute top-full right-0 mt-2 w-72 sm:w-80 md:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-left transition-all duration-200';
      dropdown.style.minWidth = '300px';
      dropdown.style.maxWidth = 'calc(100vw - 32px)';
      if (parent) {
        parent.appendChild(dropdown);
      }
    }

    let debounceTimer = null;

    const hideDropdown = () => {
      if (dropdown) dropdown.classList.add('hidden');
    };

    const showDropdown = () => {
      if (dropdown) dropdown.classList.remove('hidden');
    };

    const fetchSearchSuggestions = async (keyword) => {
      if (!keyword || keyword.length < 1) {
        hideDropdown();
        return;
      }

      dropdown.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
          <svg class="w-4 h-4 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          <span>Đang tìm kiếm gợi ý...</span>
        </div>
      `;
      showDropdown();

      try {
        let results = [];
        if (typeof ApiService !== 'undefined' && ApiService.getSearchSuggestions) {
          results = await ApiService.getSearchSuggestions(keyword);
        } else {
          const res = await fetch(`/api/public/posts/search-suggestions?q=${encodeURIComponent(keyword)}`);
          const json = await res.json();
          results = (json && json.data) ? json.data : [];
        }

        // Không hiển thị nếu người dùng đã gõ từ khác trong thời gian request
        if (input.value.trim() !== keyword) return;

        if (!results || results.length === 0) {
          dropdown.innerHTML = `
            <div class="p-4 sm:p-5 text-center text-xs text-slate-500 dark:text-slate-400">
              <p class="font-semibold text-slate-700 dark:text-slate-200">Không tìm thấy bài viết nào phù hợp</p>
              <p class="text-[11px] text-slate-400 mt-1">Vui lòng thử lại với từ khóa khác.</p>
            </div>
            <a href="search.html?q=${encodeURIComponent(keyword)}" class="block p-2.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-700 text-center text-xs font-bold text-blue-600 dark:text-blue-400 border-t border-slate-100 dark:border-slate-700 transition">
              Xem tất cả kết quả cho "${escapeHtml(keyword)}" →
            </a>
          `;
          showDropdown();
          return;
        }

        const top3 = results.slice(0, 3);
        const itemsHtml = top3.map(post => {
          const imgUrl = post.thumbnailUrl || DEFAULT_PLACEHOLDER_IMG;
          return `
            <a href="article-detail.html?slug=${post.slug}" class="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700/60 transition group cursor-pointer">
              <img src="${imgUrl}" loading="lazy" decoding="async" onerror="handleImgError(this)" class="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-200/70 dark:border-slate-700" alt="">
              <div class="flex-1 min-w-0">
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                  ${highlightKeyword(post.title, keyword)}
                </h4>
                <div class="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                  <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">${post.categoryName || 'Tin tức'}</span>
                  <span>•</span>
                  <span>${formatDate(post.publishedAt)}</span>
                </div>
              </div>
            </a>
          `;
        }).join('');

        dropdown.innerHTML = `
          <div class="py-1">
            ${itemsHtml}
          </div>
          <a href="search.html?q=${encodeURIComponent(keyword)}" class="block p-2.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-700 text-center text-xs font-bold text-blue-600 dark:text-blue-400 border-t border-slate-100 dark:border-slate-700 transition">
            Xem tất cả kết quả cho "${escapeHtml(keyword)}" →
          </a>
        `;
        showDropdown();
      } catch (err) {
        console.error("Lỗi tìm kiếm gợi ý:", err);
        hideDropdown();
      }
    };

    // Debounce 300ms khi gõ phím
    input.addEventListener('input', (e) => {
      const keyword = e.target.value.trim();
      clearTimeout(debounceTimer);
      if (keyword.length < 1) {
        hideDropdown();
        return;
      }
      debounceTimer = setTimeout(() => {
        fetchSearchSuggestions(keyword);
      }, 300);
    });

    // Tự động mở lại khi focus nếu đã có từ khóa
    input.addEventListener('focus', (e) => {
      const keyword = e.target.value.trim();
      if (keyword.length >= 1) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchSearchSuggestions(keyword);
        }, 150);
      }
    });

    // Ẩn khi bấm phím Escape
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideDropdown();
      }
    });

    // Tự động ẩn khi click ra ngoài ô tìm kiếm và dropdown
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        hideDropdown();
      }
    });
  });
}

/* ========================================================
 * PHASE 3: MODERN EDITORIAL MAGAZINE FEATURES
 * ======================================================== */

/* 1. HỘP TUYẾN BÀI PHÓNG SỰ (SERIES BOX) */
function renderArticleSeriesBox(post) {
  const container = document.getElementById('article-series-container');
  if (!container) return;

  if (!post.seriesName || !post.seriesPosts || post.seriesPosts.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.innerHTML = `
    <div class="series-box p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div class="flex items-center gap-2.5">
          <div class="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Tuyến Bài Phóng Sự Đặc Biệt</span>
        </div>
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 font-mono">${post.seriesPosts.length} kỳ</span>
      </div>

      <div>
        <h4 class="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
          ${post.seriesName}
        </h4>
      </div>

      <div class="space-y-2 pt-1 text-xs">
        ${post.seriesPosts.map(sp => {
          const isCurrent = sp.slug === post.slug;
          if (isCurrent) {
            return `
              <div class="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-semibold border border-blue-500/50 dark:border-blue-400/50 shadow-xs ring-2 ring-blue-500/10">
                <span class="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono text-[11px] font-bold shrink-0">Kỳ ${sp.seriesOrder || 1}</span>
                <span class="flex-1 text-xs sm:text-sm font-semibold line-clamp-1">${sp.title}</span>
                <span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md shrink-0 border border-blue-200/80 dark:border-blue-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                  Đang đọc
                </span>
              </div>
            `;
          } else {
            return `
              <a href="article-detail.html?slug=${sp.slug}" class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 transition shadow-2xs group">
                <span class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 group-hover:text-blue-600 font-mono text-[11px] font-bold shrink-0 transition">Kỳ ${sp.seriesOrder || 1}</span>
                <span class="flex-1 text-xs sm:text-sm font-medium line-clamp-1 transition group-hover:underline">${sp.title}</span>
                <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </a>
            `;
          }
        }).join('')}
      </div>
    </div>
  `;
  container.classList.remove('hidden');
}

/* 2. INTERACTIVE QUICK POLLS */
async function renderArticlePoll(postId) {
  const container = document.getElementById('article-poll-container');
  if (!container || !postId) return;

  try {
    const poll = await ApiService.getPostPoll(postId);
    if (!poll || !poll.id || !poll.options || poll.options.length === 0) {
      container.classList.add('hidden');
      return;
    }

    renderPollWidget(container, poll);
  } catch (err) {
    console.warn("Không có poll cho bài viết:", err);
  }
}

async function renderHomeActivePoll() {
  const container = document.getElementById('home-poll-widget-container');
  if (!container) return;

  try {
    const poll = await ApiService.getLatestActivePoll();
    if (!poll || !poll.id || !poll.options || poll.options.length === 0) {
      container.classList.add('hidden');
      return;
    }

    renderPollWidget(container, poll);
  } catch (err) {
    console.warn("Không có poll active:", err);
  }
}

function renderPollWidget(container, poll) {
  container.classList.remove('hidden');
  const votedKey = `voted_poll_${poll.id}`;
  const hasVoted = localStorage.getItem(votedKey);
  const totalVotes = (poll.options || []).reduce((acc, opt) => acc + (opt.votesCount || 0), 0);

  let optionsHtml = '';
  if (hasVoted) {
    optionsHtml = (poll.options || []).map(opt => {
      const pct = totalVotes > 0 ? Math.round((opt.votesCount * 100 / totalVotes) * 10) / 10 : 0;
      return `
        <div class="space-y-1 mb-2.5">
          <div class="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span>${opt.optionText}</span>
            <span class="font-mono text-purple-600 dark:text-purple-400 font-bold">${opt.votesCount || 0} phiếu (${pct}%)</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div class="poll-progress-bar bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('') + `<div class="text-[11px] text-slate-400 mt-2 text-right">Bạn đã tham gia bình chọn (${totalVotes} lượt)</div>`;
  } else {
    optionsHtml = `
      <div class="space-y-2">
        ${(poll.options || []).map(opt => `
          <label class="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-purple-50/60 dark:hover:bg-slate-700/60 cursor-pointer transition">
            <input type="radio" name="poll-opt-${poll.id}" value="${opt.id}" class="w-4 h-4 text-purple-600">
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">${opt.optionText}</span>
          </label>
        `).join('')}
        <button onclick="handleVotePoll(${poll.id})" class="w-full py-2.5 mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition">
          Gửi Ý Kiến Bình Chọn
        </button>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        <h4 class="font-serif text-sm font-bold text-slate-900 dark:text-slate-100">Khảo Sát Độc Giả</h4>
      </div>
      <span class="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">Interactive</span>
    </div>
    <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 leading-snug">
      ${poll.question}
    </p>
    <div id="poll-body-${poll.id}">
      ${optionsHtml}
    </div>
  `;
}

async function handleVotePoll(pollId) {
  const selected = document.querySelector(`input[name="poll-opt-${pollId}"]:checked`);
  if (!selected) {
    alert("Vui lòng chọn 1 phương án trước khi gửi bình chọn!");
    return;
  }
  const optionId = selected.value;

  try {
    const res = await ApiService.votePoll(optionId);
    localStorage.setItem(`voted_poll_${pollId}`, 'true');
    showToastNotification("Cảm ơn bạn đã tham gia bình chọn!");

    const pollData = res && res.data ? res.data : res;
    if (pollData && pollData.options) {
      const bodyEl = document.getElementById(`poll-body-${pollId}`);
      if (bodyEl) {
        bodyEl.innerHTML = pollData.options.map(opt => `
          <div class="space-y-1 mb-2.5">
            <div class="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>${opt.optionText}</span>
              <span class="font-mono text-purple-600 dark:text-purple-400 font-bold">${opt.votesCount} phiếu (${opt.percentage}%)</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div class="poll-progress-bar bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full" style="width: ${opt.percentage}%"></div>
            </div>
          </div>
        `).join('') + `<div class="text-[11px] text-slate-400 mt-2 text-right">Bạn đã tham gia bình chọn (${pollData.totalVotes} lượt)</div>`;
      }
    }
  } catch (err) {
    alert("Lỗi khi gửi bình chọn: " + err.message);
  }
}

/* 4. NATIVE BANNER ADS */
async function loadPublicBanners() {
  // HOME_TOP
  const topSlot = document.getElementById('ad-slot-home-top');
  if (topSlot) {
    try {
      const ads = await ApiService.getPublicAdsByPosition('HOME_TOP');
      if (ads && ads.length > 0) {
        const ad = ads[0];
        topSlot.innerHTML = `
          <div class="relative group rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-6">
            <div class="absolute top-2 right-2 z-10">
              <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">Tài trợ</span>
            </div>
            <a href="${ad.targetUrl}" target="_blank" onclick="ApiService.trackAdClick(${ad.id})" class="block max-h-36 sm:max-h-44 w-full overflow-hidden">
              <img src="${ad.imageUrl}" loading="lazy" decoding="async" alt="${ad.title}" class="w-full h-full object-cover group-hover:opacity-95 transition">
            </a>
          </div>
        `;
        topSlot.classList.remove('hidden');
      }
    } catch (e) {
      console.warn("Không có banner HOME_TOP:", e);
    }
  }

  // HOME_SIDEBAR
  const sideSlot = document.getElementById('ad-slot-home-sidebar');
  if (sideSlot) {
    try {
      const ads = await ApiService.getPublicAdsByPosition('HOME_SIDEBAR');
      if (ads && ads.length > 0) {
        const ad = ads[0];
        sideSlot.innerHTML = `
          <div class="relative group rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div class="absolute top-2 right-2 z-10">
              <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">Quảng cáo</span>
            </div>
            <a href="${ad.targetUrl}" target="_blank" onclick="ApiService.trackAdClick(${ad.id})" class="block w-full overflow-hidden">
              <img src="${ad.imageUrl}" loading="lazy" decoding="async" alt="${ad.title}" class="w-full h-auto object-cover group-hover:opacity-95 transition">
            </a>
          </div>
        `;
        sideSlot.classList.remove('hidden');
      }
    } catch (e) {
      console.warn("Không có banner HOME_SIDEBAR:", e);
    }
  }

  // ARTICLE_SIDEBAR
  const articleSideSlot = document.getElementById('ad-slot-article-sidebar');
  if (articleSideSlot) {
    try {
      const ads = await ApiService.getPublicAdsByPosition('ARTICLE_SIDEBAR');
      if (ads && ads.length > 0) {
        const ad = ads[0];
        articleSideSlot.innerHTML = `
          <div class="relative group rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div class="absolute top-2 right-2 z-10">
              <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">Tài trợ</span>
            </div>
            <a href="${ad.targetUrl}" target="_blank" onclick="ApiService.trackAdClick(${ad.id})" class="block w-full overflow-hidden">
              <img src="${ad.imageUrl}" loading="lazy" decoding="async" alt="${ad.title}" class="w-full h-auto object-cover group-hover:opacity-95 transition">
            </a>
          </div>
        `;
        articleSideSlot.classList.remove('hidden');
      }
    } catch (e) {
      console.warn("Không có banner ARTICLE_SIDEBAR:", e);
    }
  }
}

/* ========================================================
 * 12. CÁ NHÂN HÓA ĐỌC BÁO & BOOKMARK (100% LIGHTWEIGHT & FREE)
 * ======================================================== */

/**
 * 1. Ghi nhận bài viết đã đọc (Cả Khách vãng lai & Thành viên)
 */
async function recordArticleRead(postId, categoryId) {
  if (!postId) return;

  // A. Lưu cục bộ trình duyệt (localStorage) cho khách vãng lai
  try {
    let readPosts = JSON.parse(localStorage.getItem('guest_read_posts') || '[]');
    if (!readPosts.includes(postId)) {
      readPosts.unshift(postId);
      if (readPosts.length > 30) readPosts.pop();
      localStorage.setItem('guest_read_posts', JSON.stringify(readPosts));
    }

    if (categoryId) {
      let readCategories = JSON.parse(localStorage.getItem('guest_read_categories') || '[]');
      if (!readCategories.includes(categoryId)) {
        readCategories.unshift(categoryId);
        if (readCategories.length > 10) readCategories.pop();
        localStorage.setItem('guest_read_categories', JSON.stringify(readCategories));
      }
    }
  } catch (e) {
    // Ignore storage errors
  }

  // B. Đồng bộ lên Server nếu độc giả đã đăng nhập
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      await ApiService.recordReadHistory(postId);
    } catch (e) {
      // Non-critical, ignore
    }
  }
}

/**
 * 2. Quản lý Cache & Trạng thái Bookmark toàn trang
 */
window.userBookmarkedIdsSet = new Set();
let isBookmarkCacheLoaded = false;

async function initUserBookmarkCache() {
  if (isBookmarkCacheLoaded) return;
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      const bookmarks = await ApiService.getBookmarks(0, 100);
      if (Array.isArray(bookmarks)) {
        bookmarks.forEach(b => window.userBookmarkedIdsSet.add(Number(b.id)));
      }
      isBookmarkCacheLoaded = true;
    } catch (e) {
      console.warn("Could not load user bookmarks cache:", e);
    }
  } else {
    try {
      const guestBookmarks = JSON.parse(localStorage.getItem('guest_bookmarks') || '[]');
      guestBookmarks.forEach(id => window.userBookmarkedIdsSet.add(Number(id)));
      isBookmarkCacheLoaded = true;
    } catch (e) {}
  }
}

function updateAllBookmarkButtons(postId, isSaved) {
  postId = Number(postId);
  if (isSaved) {
    window.userBookmarkedIdsSet.add(postId);
  } else {
    window.userBookmarkedIdsSet.delete(postId);
  }

  // Cập nhật tất cả các button trên các card bài viết có data-bookmark-id
  document.querySelectorAll(`[data-bookmark-id="${postId}"]`).forEach(btn => {
    if (isSaved) {
      btn.className = 'bookmark-card-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 shadow-md flex items-center justify-center text-sm transition transform hover:scale-110';
      btn.innerHTML = BOOKMARK_FILLED_SVG;
      btn.title = 'Đã lưu (Bấm để gỡ khỏi danh sách)';
    } else {
      btn.className = 'bookmark-card-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-blue-600 shadow-md flex items-center justify-center text-sm transition transform hover:scale-110';
      btn.innerHTML = BOOKMARK_OUTLINE_SVG;
      btn.title = 'Lưu bài viết vào danh sách đọc sau';
    }
  });

  // Cập nhật nút trên trang chi tiết nếu có
  const detailBtn = document.getElementById('bookmark-btn');
  const icon = document.getElementById('bookmark-icon');
  const text = document.getElementById('bookmark-text');
  if (detailBtn && String(currentArticlePostId) === String(postId)) {
    if (isSaved) {
      detailBtn.classList.add('bg-blue-50', 'text-blue-700', 'border', 'border-blue-300');
      detailBtn.classList.remove('bg-slate-100', 'text-slate-800');
      if (icon) icon.innerHTML = BOOKMARK_FILLED_SVG;
      if (text) text.innerText = 'Đã lưu';
    } else {
      detailBtn.classList.remove('bg-blue-50', 'text-blue-700', 'border', 'border-blue-300');
      detailBtn.classList.add('bg-slate-100', 'text-slate-800');
      if (icon) icon.innerHTML = BOOKMARK_OUTLINE_SVG;
      if (text) text.innerText = 'Lưu bài';
    }
  }
}

async function checkAndUpdateBookmarkButton(postId) {
  if (!postId) return;
  postId = Number(postId);
  await initUserBookmarkCache();
  const isSaved = window.userBookmarkedIdsSet.has(postId);
  updateAllBookmarkButtons(postId, isSaved);
}

/**
 * 3. Bấm nút Lưu / Bỏ lưu bài viết (Toggle Bookmark)
 */
async function toggleArticleBookmark(postId = currentArticlePostId) {
  if (!postId) return;
  postId = Number(postId);

  const token = localStorage.getItem('accessToken');
  let isSaved = false;

  if (token) {
    try {
      const res = await ApiService.toggleBookmark(postId);
      if (res && res.data) {
        isSaved = res.data.isBookmarked;
      }
    } catch (err) {
      alert("Không thể lưu bài viết. Vui lòng đăng nhập lại!");
      return;
    }
  } else {
    // Khách vãng lai: Lưu vào localStorage
    try {
      let guestBookmarks = JSON.parse(localStorage.getItem('guest_bookmarks') || '[]');
      if (guestBookmarks.includes(postId)) {
        guestBookmarks = guestBookmarks.filter(id => id !== postId);
        isSaved = false;
      } else {
        guestBookmarks.unshift(postId);
        isSaved = true;
      }
      localStorage.setItem('guest_bookmarks', JSON.stringify(guestBookmarks));
    } catch (e) {
      alert("Trình duyệt không hỗ trợ lưu cục bộ!");
      return;
    }
  }

  updateAllBookmarkButtons(postId, isSaved);

  const toastMsg = isSaved 
    ? "Đã lưu bài viết vào danh sách đọc sau! Xem tại Trang cá nhân" 
    : "Đã gỡ bài viết khỏi danh sách đã lưu.";
  showQuickToast(toastMsg);
}

function showQuickToast(msg) {
  const existing = document.getElementById('quick-toast-notice');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'quick-toast-notice';
  toast.className = 'fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce transition';
  toast.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * 4. Hiển thị khối Đề Xuất "Dành Cho Bạn" trên Trang Chủ
 */
async function renderForYouRecommendations() {
  const container = document.getElementById('for-you-container');
  if (!container) return;

  await initUserBookmarkCache();

  // Thu thập tín hiệu sở thích
  let catIds = [];
  let excludeIds = [];

  try {
    const guestCats = JSON.parse(localStorage.getItem('guest_read_categories') || '[]');
    const prefCats = JSON.parse(localStorage.getItem('user_topic_preferences') || '[]');
    catIds = [...new Set([...prefCats, ...guestCats])];
    excludeIds = JSON.parse(localStorage.getItem('guest_read_posts') || '[]').slice(0, 10);
  } catch (e) {}

  try {
    const posts = await ApiService.getForYouRecommendations({
      categoryIds: catIds.join(','),
      excludeIds: excludeIds.join(','),
      limit: 6
    });

    if (!posts || posts.length === 0) {
      container.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-slate-400">Chưa có đủ dữ liệu đề xuất. Hãy đọc thêm một vài bài báo để hệ thống hiểu sở thích của bạn nhé!</div>`;
      return;
    }

    container.innerHTML = posts.map(post => {
      const imgUrl = post.thumbnailUrl || DEFAULT_PLACEHOLDER_IMG;
      const readTime = post.readingTime ? `${post.readingTime}p đọc` : '3p đọc';
      const relTime = formatRelativeTime(post.publishedAt);
      const isBookmarked = window.userBookmarkedIdsSet.has(Number(post.id));

      const btnClass = isBookmarked
        ? 'bookmark-card-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 shadow-md flex items-center justify-center text-sm transition transform hover:scale-110'
        : 'bookmark-card-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-blue-600 shadow-md flex items-center justify-center text-sm transition transform hover:scale-110';
      const btnIcon = isBookmarked ? BOOKMARK_FILLED_SVG : BOOKMARK_OUTLINE_SVG;
      const btnTitle = isBookmarked ? 'Đã lưu (Bấm để gỡ khỏi danh sách)' : 'Lưu bài viết vào danh sách đọc sau';

      return `
        <div class="news-card-hover group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-700/80 hover:shadow-md transition">
          <div class="relative overflow-hidden h-44 cursor-pointer" onclick="location.href='article-detail.html?slug=${post.slug}'">
            <img src="${imgUrl}" loading="lazy" decoding="async" onerror="handleImgError(this)" class="news-img-zoom w-full h-full object-cover" alt="${post.title}">
            <span class="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md shadow-xs">
              ${post.categoryName || 'Gợi ý'}
            </span>
            <button data-bookmark-id="${post.id}" onclick="event.stopPropagation(); toggleArticleBookmark(${post.id})" class="${btnClass}" title="${btnTitle}">
              ${btnIcon}
            </button>
          </div>
          <div class="p-4 flex flex-col justify-between flex-1 space-y-2.5">
            <div class="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span>${relTime}</span>
              <span>•</span>
              <span class="text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center gap-1">${CLOCK_ICON_SVG} <span>${readTime}</span></span>
            </div>
            <h3 class="font-serif text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition leading-snug cursor-pointer" onclick="location.href='article-detail.html?slug=${post.slug}'">
              ${post.title}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              ${post.sapo || ''}
            </p>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi nạp tin Dành cho bạn:", err);
    container.innerHTML = `<div class="col-span-full py-6 text-center text-xs text-slate-400">Không thể tải danh sách gợi ý.</div>`;
  }
}

/**
 * 5. Quản lý Modal Tùy chọn chủ đề quan tâm (Topic Preferences Onboarding)
 */
async function openTopicPreferencesModal() {
  const modal = document.getElementById('topic-preferences-modal');
  const container = document.getElementById('topic-options-list');
  if (!modal || !container) return;

  modal.classList.remove('hidden');
  container.innerHTML = `<div class="col-span-2 text-center py-4 text-xs text-slate-400">Đang tải danh mục...</div>`;

  try {
    const categories = await ApiService.getCategories();
    let savedPrefs = [];

    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        savedPrefs = await ApiService.getUserPreferences();
      } catch (e) {
        savedPrefs = JSON.parse(localStorage.getItem('user_topic_preferences') || '[]');
      }
    } else {
      savedPrefs = JSON.parse(localStorage.getItem('user_topic_preferences') || '[]');
    }

    if (!categories || categories.length === 0) {
      container.innerHTML = `<div class="col-span-2 text-center py-4 text-xs text-slate-400">Chưa có danh mục.</div>`;
      return;
    }

    container.innerHTML = categories.map(c => {
      const isChecked = savedPrefs.includes(c.id);
      return `
        <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/50 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 transition">
          <input type="checkbox" name="topic-pref" value="${c.id}" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-blue-600 rounded">
          <span class="truncate">${c.name}</span>
        </label>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="col-span-2 text-center py-4 text-xs text-rose-500">Lỗi tải danh mục.</div>`;
  }
}

function closeTopicPreferencesModal() {
  const modal = document.getElementById('topic-preferences-modal');
  if (modal) modal.classList.add('hidden');
}

async function saveTopicPreferences() {
  const checkboxes = document.querySelectorAll('input[name="topic-pref"]:checked');
  const selectedIds = Array.from(checkboxes).map(cb => Number(cb.value));

  localStorage.setItem('user_topic_preferences', JSON.stringify(selectedIds));

  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      await ApiService.saveUserPreferences(selectedIds);
    } catch (e) {
      console.warn("Lưu sở thích lên server:", e);
    }
  }

  closeTopicPreferencesModal();
  showQuickToast("Đã cập nhật chủ đề quan tâm của bạn!");
  renderForYouRecommendations();
}

/**
 * 6. Modal Bài viết đã lưu & Lịch sử đọc gần đây
 */
let currentSavedTab = 'bookmarks';

function openSavedArticlesModal() {
  const modal = document.getElementById('saved-articles-modal');
  if (modal) {
    modal.classList.remove('hidden');
    switchSavedTab('bookmarks');
  }
}

function closeSavedArticlesModal() {
  const modal = document.getElementById('saved-articles-modal');
  if (modal) modal.classList.add('hidden');
}

function switchSavedTab(tab) {
  currentSavedTab = tab;
  const btnBookmarks = document.getElementById('tab-btn-bookmarks');
  const btnHistory = document.getElementById('tab-btn-history');

  if (tab === 'bookmarks') {
    if (btnBookmarks) {
      btnBookmarks.className = 'px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-xs transition';
    }
    if (btnHistory) {
      btnHistory.className = 'px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition';
    }
  } else {
    if (btnHistory) {
      btnHistory.className = 'px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-xs transition';
    }
    if (btnBookmarks) {
      btnBookmarks.className = 'px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition';
    }
  }

  loadUserSavedArticles(tab);
}

async function loadUserSavedArticles(tab) {
  const container = document.getElementById('saved-articles-list');
  if (!container) return;

  container.innerHTML = `<div class="py-8 text-center text-xs text-slate-400">Đang tải danh sách bài viết...</div>`;

  const token = localStorage.getItem('accessToken');
  let posts = [];

  try {
    if (tab === 'bookmarks') {
      if (token) {
        posts = await ApiService.getBookmarks(0, 15);
      } else {
        const guestBookmarks = JSON.parse(localStorage.getItem('guest_bookmarks') || '[]');
        if (guestBookmarks.length > 0) {
          const all = await ApiService.getPosts({ size: 30 });
          posts = (all || []).filter(p => guestBookmarks.includes(p.id));
        }
      }
    } else {
      // history
      if (token) {
        posts = await ApiService.getReadingHistory(0, 15);
      } else {
        const guestHistory = JSON.parse(localStorage.getItem('guest_read_posts') || '[]');
        if (guestHistory.length > 0) {
          const all = await ApiService.getPosts({ size: 30 });
          posts = (all || []).filter(p => guestHistory.includes(p.id));
        }
      }
    }

    if (!posts || posts.length === 0) {
      const emptyMsg = tab === 'bookmarks' 
        ? "Bạn chưa lưu bài viết nào để đọc sau." 
        : "Chưa có lịch sử đọc bài viết nào.";
      container.innerHTML = `<div class="py-12 text-center text-xs text-slate-400 space-y-2">
        <svg class="w-8 h-8 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
        <div>${emptyMsg}</div>
      </div>`;
      return;
    }

    container.innerHTML = posts.map(p => {
      const imgUrl = p.thumbnailUrl || DEFAULT_PLACEHOLDER_IMG;
      return `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/50 transition border border-slate-100 dark:border-slate-700/80 gap-3">
          <div class="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onclick="location.href='article-detail.html?slug=${p.slug}'">
            <img src="${imgUrl}" loading="lazy" decoding="async" onerror="handleImgError(this)" class="w-16 h-12 object-cover rounded-xl shrink-0" alt="${p.title}">
            <div class="min-w-0 flex-1">
              <span class="text-[10px] font-bold text-blue-600 uppercase">${p.categoryName || 'Tin tức'}</span>
              <h4 class="text-xs font-bold text-slate-800 dark:text-white truncate hover:text-blue-600 transition leading-snug">${p.title}</h4>
              <span class="text-[10px] text-slate-400 mt-0.5 block">${formatDate(p.publishedAt)}</span>
            </div>
          </div>
          ${tab === 'bookmarks' ? `
            <button onclick="toggleArticleBookmark(${p.id}); loadUserSavedArticles('bookmarks');" class="text-slate-400 hover:text-rose-600 text-xs font-semibold p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0 flex items-center gap-1" title="Bỏ lưu bài viết">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              <span>Bỏ lưu</span>
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi nạp bài viết đã lưu:", err);
    container.innerHTML = `<div class="py-8 text-center text-xs text-rose-500">Không thể tải danh sách bài viết.</div>`;
  }
}

