/**
 * API SERVICE LAYER (Fetch API kết nối Spring Boot Backend RESTful API)
 * Tự động gắn JWT Authorization Bearer Token vào Header cho các thao tác Admin
 */

const ApiService = {
  // Helper: Lấy JWT Token từ localStorage
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Helper chung xử lý fetch
  async request(url, options = {}) {
    const defaultHeaders = this.getAuthHeaders();
    const finalHeaders = { ...defaultHeaders, ...(options.headers || {}) };
    
    // Nếu gửi FormData (upload file), bỏ Content-Type để browser tự sinh boundary
    if (options.body instanceof FormData) {
      delete finalHeaders['Content-Type'];
    }

    try {
      const res = await fetch(url, { ...options, headers: finalHeaders });
      
      // Xử lý 401 Unauthorized: Phiên làm việc hết hạn hoặc token không hợp lệ
      if (res.status === 401) {
        if (window.location.pathname.includes('admin.html')) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          alert("Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại!");
          window.location.reload();
          throw new Error("Phiên làm việc hết hạn");
        }
      }

      // Xử lý 403 Forbidden: Tài khoản không có quyền thao tác tính năng này (KHÔNG xóa session người dùng)
      if (res.status === 403) {
        console.warn(`[403 Forbidden] Tài khoản không có quyền truy cập: ${url}`);
        throw new Error("Tài khoản của bạn không đủ quyền hạn để thực hiện thao tác này.");
      }

      if (res.status === 413) {
        throw new Error("Dung lượng file quá lớn (vượt quá giới hạn Nginx / Server)!");
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON Server Error Response:", text);
        throw new Error(`Lỗi máy chủ (${res.status}): Không thể xử lý phản hồi từ server.`);
      }

      const json = await res.json();
      return json;
    } catch (err) {
      console.error(`API Fetch Error [${url}]:`, err);
      throw err;
    }
  },

  /* ========================================================
   * 0. AUTHENTICATION & CURRENT USER PROFILE
   * ======================================================== */
  async getMe() {
    try {
      const json = await this.request(`${CONFIG.API_BASE_URL}/auth/me`);
      return (json && json.data) ? json.data : null;
    } catch (e) {
      console.warn("Failed to fetch /auth/me:", e);
      return null;
    }
  },

  async loginWithGoogle(credential) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/auth/google`, {
      method: "POST",
      body: JSON.stringify({ credential })
    });
    return (json && json.data) ? json.data : json;
  },

  /* ========================================================
   * 1. PUBLIC APIS (Độc giả & Khách vãng lai)
   * ======================================================== */
  async getHomepageNews() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/news/homepage`);
    return (json && json.data) ? json.data : { spotlight: [], latest: [], trending: [] };
  },

  async getCategories() {
    try {
      const json = await this.request(`${CONFIG.API_BASE_URL}/news/categories`);
      if (json && json.data && json.data.length > 0) return json.data;
    } catch (e) {
      console.warn("Public categories API error, trying fallback...", e);
    }
    try {
      const json = await this.request(`${CONFIG.API_BASE_URL}/admin/categories`);
      return (json && json.data) ? json.data : [];
    } catch (e) {
      return [];
    }
  },

  async getPostsByCategory(slug, page = 0, size = 10) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/news/category/${slug}?page=${page}&size=${size}`);
    return (json && json.data) ? json.data.content : [];
  },

  async getPostBySlug(slug, incrementView = true) {
    const url = `${CONFIG.API_BASE_URL}/news/article/${encodeURIComponent(slug)}${incrementView ? '' : '?incrementView=false'}`;
    const json = await this.request(url);
    return json ? json.data : null;
  },

  async getPosts(params = {}) {
    try {
      const news = await this.getHomepageNews();
      let all = [];
      if (news) {
        if (news.trending && Array.isArray(news.trending)) all.push(...news.trending);
        if (news.latest && Array.isArray(news.latest)) all.push(...news.latest);
        if (news.spotlight && Array.isArray(news.spotlight)) all.push(...news.spotlight);
      }
      const uniqueMap = new Map();
      all.forEach(p => { if (p && p.id && !uniqueMap.has(p.id)) uniqueMap.set(p.id, p); });
      let list = Array.from(uniqueMap.values());
      if (params.sort === 'views') {
        list.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
      }
      return list.slice(0, params.size || 5);
    } catch (e) {
      return [];
    }
  },

  async searchPosts(query, page = 0, size = 10) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/news/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
    return (json && json.data) ? json.data.content : [];
  },

  async getSearchSuggestions(query) {
    if (!query || !query.trim()) return [];
    try {
      const json = await this.request(`${CONFIG.API_BASE_URL}/news/search-suggestions?q=${encodeURIComponent(query.trim())}`);
      return (json && json.data && Array.isArray(json.data)) ? json.data : [];
    } catch (e) {
      console.warn("Lỗi lấy gợi ý tìm kiếm:", e);
      return [];
    }
  },

  async addComment(postId, commentData) {
    const payload = {
      postId: Number(postId),
      userName: commentData.userName || 'Độc giả',
      email: commentData.email || '',
      content: commentData.content || '',
      parentId: commentData.parentId ? Number(commentData.parentId) : null
    };
    try {
      const json = await this.request(`/api/comments`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return json ? json.data : null;
    } catch (err) {
      const json = await this.request(`${CONFIG.API_BASE_URL}/comments`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return json ? json.data : null;
    }
  },

  async getPostComments(postId) {
    try {
      const json = await this.request(`/api/comments/post/${postId}`);
      return (json && json.data) ? json.data : [];
    } catch (err) {
      const json = await this.request(`${CONFIG.API_BASE_URL}/news/posts/${postId}/comments`);
      return (json && json.data) ? json.data : [];
    }
  },

  async uploadMedia(file) {
    const formData = new FormData();
    formData.append('file', file);
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/media/upload`, {
      method: "POST",
      body: formData
    });
    if (json && json.success && json.data) {
      return json.data;
    } else {
      throw new Error((json && json.message) ? json.message : "Tải tập tin thất bại!");
    }
  },

  /* ========================================================
   * 2. ADMIN DASHBOARD & BÀI VIẾT (POSTS)
   * ======================================================== */
  async getAdminStats() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/dashboard`);
    return json ? json.data : null;
  },

  async getAdminPosts(status = '', page = 0, size = 20) {
    let url = `${CONFIG.API_BASE_URL}/admin/posts?page=${page}&size=${size}`;
    if (status && status !== 'ALL') {
      url += `&status=${status}`;
    }
    const json = await this.request(url);
    return (json && json.data) ? json.data.content : [];
  },

  async getPostById(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/posts/${id}`);
    return json ? json.data : null;
  },

  async createPost(postData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/posts`, {
      method: "POST",
      body: JSON.stringify(postData)
    });
    if (json && json.success && json.data) {
      return json.data;
    } else {
      throw new Error((json && json.message) ? json.message : "Tạo bài viết thất bại!");
    }
  },

  async updatePost(id, postData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(postData)
    });
    if (json && json.success && json.data) {
      return json.data;
    } else {
      throw new Error((json && json.message) ? json.message : "Cập nhật bài viết thất bại!");
    }
  },

  async deletePost(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/posts/${id}`, {
      method: "DELETE"
    });
    return json ? json.success : false;
  },

  async updatePostStatus(id, status, reason = '') {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/posts/${id}/status?status=${status}&rejectionReason=${encodeURIComponent(reason)}`, {
      method: "PATCH"
    });
    return json ? json.success : false;
  },

  async toggleSpotlight(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/posts/${id}/spotlight`, {
      method: "PATCH"
    });
    return json;
  },

  async toggleTrending(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/posts/${id}/trending`, {
      method: "PATCH"
    });
    return json;
  },

  /* ========================================================
   * 3. ADMIN QUẢN LÝ CHUYÊN MỤC (CATEGORIES)
   * ======================================================== */
  async createCategory(catData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/categories`, {
      method: "POST",
      body: JSON.stringify(catData)
    });
    return json;
  },

  async updateCategory(id, catData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(catData)
    });
    return json;
  },

  async deleteCategory(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/categories/${id}`, {
      method: "DELETE"
    });
    return json;
  },

  /* ========================================================
   * 4. ADMIN QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (USERS & RBAC)
   * ======================================================== */
  async getUsers() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/users`);
    return (json && json.data) ? json.data : [];
  },

  async createUser(userData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/users`, {
      method: "POST",
      body: JSON.stringify(userData)
    });
    return json;
  },

  async updateUser(id, userData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData)
    });
    return json;
  },

  async toggleUserStatus(id, status) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/users/${id}/status?status=${status}`, {
      method: "PATCH"
    });
    return json;
  },

  async deleteUser(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE"
    });
    return json;
  },

  /* ========================================================
   * 5. ADMIN QUẢN LÝ BÌNH LUẬN (COMMENTS MODERATION)
   * ======================================================== */
  async getComments(status = '') {
    let url = `${CONFIG.API_BASE_URL}/admin/comments`;
    if (status && status !== 'ALL') {
      url += `?status=${status}`;
    }
    const json = await this.request(url);
    return (json && json.data) ? json.data : [];
  },

  async moderateComment(id, status) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/comments/${id}/status?status=${status}`, {
      method: "PATCH"
    });
    return json;
  },

  async deleteComment(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/comments/${id}`, {
      method: "DELETE"
    });
    return json;
  },

  /* ========================================================
   * 6. HỆ THỐNG & CACHE (SYSTEM SETTINGS)
   * ======================================================== */
  async clearCache() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/settings/clear-cache`, {
      method: "POST"
    });
    return json;
  },

  async getSystemSettings() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/settings`);
    return (json && json.data) ? json.data : null;
  },

  async uploadMedia(file) {
    const formData = new FormData();
    formData.append("file", file);

    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/media/upload`, {
      method: "POST",
      body: formData
    });

    if (json && json.success && json.data) {
      return json.data;
    }
    throw new Error(json ? json.message : "Tải tập tin thất bại");
  },

  async importDocxPost(file) {
    const formData = new FormData();
    formData.append("file", file);

    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/posts/import-docx`, {
      method: "POST",
      body: formData
    });

    if (json && json.success && json.data) {
      return json.data;
    }
    throw new Error(json ? json.message : "Chuyển đổi file Word (.docx) thất bại");
  },

  /* ========================================================
   * 7. QUẢN LÝ QUẢNG CÁO & BANNER (ADVERTISEMENTS)
   * ======================================================== */
  async getAdminAdvertisements() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/advertisements`);
    return (json && json.data) ? json.data : [];
  },

  async createAdvertisement(adData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/advertisements`, {
      method: "POST",
      body: JSON.stringify(adData)
    });
    return (json && json.data) ? json.data : null;
  },

  async updateAdvertisement(id, adData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/advertisements/${id}`, {
      method: "PUT",
      body: JSON.stringify(adData)
    });
    return (json && json.data) ? json.data : null;
  },

  async toggleAdvertisementStatus(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/advertisements/${id}/toggle`, {
      method: "PATCH"
    });
    return json;
  },

  async deleteAdvertisement(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/advertisements/${id}`, {
      method: "DELETE"
    });
    return json;
  },

  async getPublicAdsByPosition(position) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/public/advertisements/position/${position}`);
    return (json && json.data) ? json.data : [];
  },

  async trackAdClick(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/public/advertisements/${id}/click`, {
      method: "POST"
    });
    return json;
  },

  /* ========================================================
   * 8. THĂM DÒ Ý KIẾN / BÌNH CHỌN (INTERACTIVE POLLS)
   * ======================================================== */
  async getAdminPolls() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/polls`);
    return (json && json.data) ? json.data : [];
  },

  async createPoll(pollData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/polls`, {
      method: "POST",
      body: JSON.stringify(pollData)
    });
    return (json && json.data) ? json.data : null;
  },

  async togglePollStatus(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/polls/${id}/toggle`, {
      method: "PATCH"
    });
    return json;
  },

  async deletePoll(id) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/admin/polls/${id}`, {
      method: "DELETE"
    });
    return json;
  },

  async getPostPoll(postId) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/public/polls/post/${postId}`);
    return (json && json.data) ? json.data : null;
  },

  async getLatestActivePoll() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/public/polls/active`);
    return (json && json.data) ? json.data : null;
  },

  async votePoll(optionId) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/public/polls/vote/${optionId}`, {
      method: "POST"
    });
    return (json && json.data) ? json.data : null;
  },

  /* ========================================================
   * 8. CÁ NHÂN HÓA ĐỌC BÁO & BOOKMARK (PERSONALIZATION)
   * ======================================================== */
  async getForYouRecommendations(params = {}) {
    let url = `${CONFIG.API_BASE_URL}/public/recommendations/for-you?limit=${params.limit || 6}`;
    if (params.categoryIds) url += `&categoryIds=${encodeURIComponent(params.categoryIds)}`;
    if (params.excludeIds) url += `&excludeIds=${encodeURIComponent(params.excludeIds)}`;
    const json = await this.request(url);
    return (json && json.data) ? json.data : [];
  },

  async getSmartRelatedPosts(postId, limit = 4) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/public/recommendations/related/${postId}?limit=${limit}`);
    return (json && json.data) ? json.data : [];
  },

  async recordReadHistory(postId) {
    return await this.request(`${CONFIG.API_BASE_URL}/user/history/${postId}`, { method: "POST" });
  },

  async getReadingHistory(page = 0, size = 10) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/user/history?page=${page}&size=${size}`);
    return (json && json.data) ? json.data : [];
  },

  async toggleBookmark(postId) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/user/bookmarks/${postId}`, { method: "POST" });
    return (json && json.data) ? json.data : null;
  },

  async getBookmarks(page = 0, size = 10) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/user/bookmarks?page=${page}&size=${size}`);
    return (json && json.data) ? json.data : [];
  },

  async checkBookmarkStatus(postId) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/user/bookmarks/status/${postId}`);
    return (json && json.data) ? json.data.isBookmarked : false;
  },

  async getUserPreferences() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/user/preferences`);
    return (json && json.data) ? json.data : [];
  },

  async saveUserPreferences(categoryIds) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/user/preferences`, {
      method: "POST",
      body: JSON.stringify(categoryIds)
    });
    return (json && json.data) ? json.data : [];
  },

  async clearReadingHistory() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/user/history`, {
      method: "DELETE"
    });
    return (json && json.data) ? json.data : null;
  },

  async updateProfile(profileData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/auth/profile`, {
      method: "PUT",
      body: JSON.stringify(profileData)
    });
    return (json && json.data) ? json.data : null;
  },

  async changePassword(passwordData) {
    const json = await this.request(`${CONFIG.API_BASE_URL}/auth/change-password`, {
      method: "POST",
      body: JSON.stringify(passwordData)
    });
    return json;
  },

  async getUserStats() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/auth/stats`);
    return (json && json.data) ? json.data : { bookmarksCount: 0, historyCount: 0, topicsCount: 0, commentsCount: 0 };
  },

  async getUserComments() {
    const json = await this.request(`${CONFIG.API_BASE_URL}/auth/comments`);
    return (json && json.data) ? json.data : [];
  }
};
