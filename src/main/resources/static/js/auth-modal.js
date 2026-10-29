/**
 * AUTHENTICATION MODAL & OTP VERIFICATION (auth-modal.js)
 * Quy trình 2 bước: 
 *   Bước 1: Điền thông tin -> Bấm "Gửi mã OTP về Gmail"
 *   Bước 2: Nhập mã OTP 6 chữ số -> Bấm "Xác thực OTP & Tạo tài khoản" (ĐÚNG MỚI LƯU CSDL)
 */

function openAuthModal(tab = 'login') {
  let modal = document.getElementById('auth-modal');
  if (!modal) {
    createAuthModalDOM();
    modal = document.getElementById('auth-modal');
  }
  switchTab(tab);
  modal.classList.remove('hidden');
  setTimeout(setupGoogleIdentity, 150);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function switchTab(tab) {
  const loginForm = document.getElementById('modal-login-form');
  const registerForm = document.getElementById('modal-register-form');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLoginBtn.className = 'flex-1 py-2 font-bold text-sm border-b-2 border-blue-600 text-blue-600';
    tabRegisterBtn.className = 'flex-1 py-2 font-bold text-sm border-b-2 border-transparent text-gray-400 hover:text-gray-600';
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabRegisterBtn.className = 'flex-1 py-2 font-bold text-sm border-b-2 border-blue-600 text-blue-600';
    tabLoginBtn.className = 'flex-1 py-2 font-bold text-sm border-b-2 border-transparent text-gray-400 hover:text-gray-600';
  }
}

function createAuthModalDOM() {
  const div = document.createElement('div');
  div.id = 'auth-modal';
  div.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm hidden p-4';
  div.innerHTML = `
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[92vh] flex flex-col overflow-y-auto no-scrollbar">
      
      <!-- Modal Header -->
      <div class="flex justify-between items-center px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <h3 class="text-lg font-extrabold text-blue-600">TÀI KHOẢN NEWS PORTAL</h3>
        <button onclick="closeAuthModal()" class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Đóng">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Modal Tabs -->
      <div class="flex border-b border-gray-100 dark:border-gray-800 text-center bg-gray-50 dark:bg-gray-800/50">
        <button id="tab-login-btn" onclick="switchTab('login')" class="flex-1 py-2.5 font-bold text-sm border-b-2 border-blue-600 text-blue-600">Đăng nhập</button>
        <button id="tab-register-btn" onclick="switchTab('register')" class="flex-1 py-2.5 font-bold text-sm border-b-2 border-transparent text-gray-400">Đăng ký mới</button>
      </div>

      <div class="p-6">
        <!-- GOOGLE SIGN-IN BUTTON (GSI & Fallback Redirect chuẩn Task3) -->
        <div class="mb-4">
          <div id="googleIdentityBtn" class="flex justify-center w-full min-h-[44px]"></div>
          <a href="/api/v1/users/auth/social-login?login_type=google" id="btnGoogleDirect" class="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-full shadow-xs transition cursor-pointer">
            <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Tiếp tục với Google</span>
          </a>
          
          <div class="flex items-center my-4">
            <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span class="px-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Hoặc</span>
            <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>
        </div>

        <!-- FORM 1: ĐĂNG NHẬP -->
        <form id="modal-login-form" onsubmit="handleLoginSubmit(event)" class="space-y-4">
          <div id="login-error-msg" class="hidden p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-semibold"></div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Tên đăng nhập</label>
            <input type="text" id="login-username" required class="w-full p-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Mật khẩu</label>
            <input type="password" id="login-password" required class="w-full p-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-600">
          </div>
          <button type="submit" id="btn-login-submit" class="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow flex items-center justify-center gap-2 cursor-pointer">
            <span>ĐĂNG NHẬP NGAY</span>
          </button>
        </form>

        <!-- FORM 2: ĐĂNG KÝ XÁC THỰC MÃ OTP GMAIL 2 BƯỚC -->
        <form id="modal-register-form" onsubmit="handleRegisterSubmit(event)" class="space-y-4 hidden">
          <div id="register-msg" class="hidden p-3 text-xs rounded-lg font-semibold"></div>
          
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Họ và tên</label>
            <input type="text" id="reg-fullname" required placeholder="Nguyễn Văn A" class="w-full p-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-600">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Tên đăng nhập</label>
            <input type="text" id="reg-username" required placeholder="user123" class="w-full p-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-600">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Địa chỉ Gmail nhận OTP</label>
            <div class="flex gap-2">
              <input type="email" id="reg-email" required placeholder="example@gmail.com" class="flex-1 p-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-600">
              <button type="button" id="btn-send-otp" onclick="handleSendOtp()" class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition whitespace-nowrap">
                Gửi mã OTP
              </button>
            </div>
          </div>

          <!-- MÃ OTP INPUT FIELD -->
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Nhập mã OTP 6 chữ số từ Gmail</label>
            <input type="text" id="reg-otp" required maxlength="6" placeholder="000000" class="w-full p-2.5 text-base font-bold text-center tracking-widest bg-amber-50 text-blue-700 border border-amber-300 rounded-lg focus:outline-none focus:border-blue-600">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Mật khẩu</label>
            <input type="password" id="reg-password" required minlength="6" class="w-full p-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-600">
          </div>

          <button type="submit" id="btn-register-submit" class="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow">
            XÁC THỰC OTP & TẠO TÀI KHOẢN
          </button>
        </form>
      </div>

    </div>
  `;
  document.body.appendChild(div);
}

/**
 * BƯỚC 1: BẤM "GỬI MÃ OTP" (Gửi POST /api/v1/auth/send-otp)
 */
async function handleSendOtp() {
  const email = document.getElementById('reg-email').value;
  const username = document.getElementById('reg-username').value;
  const msgBox = document.getElementById('register-msg');
  const btnSend = document.getElementById('btn-send-otp');

  if (!email || !username) {
    msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-red-50 text-red-600 border border-red-200 block";
    msgBox.innerText = "Vui lòng nhập Tên đăng nhập và Địa chỉ Gmail trước khi lấy mã OTP!";
    return;
  }

  btnSend.disabled = true;
  btnSend.innerText = "Đang gửi...";
  msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-blue-50 text-blue-600 border border-blue-200 block";
  msgBox.innerText = "Đang sinh mã OTP và gửi về Gmail của bạn...";

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username })
    });

    const json = await res.json();

    if (json.success) {
      msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-green-50 text-green-700 border border-green-200 block";
      msgBox.innerText = json.data || json.message;
      
      // Đếm ngược 60 giây gửi lại
      let countdown = 60;
      const interval = setInterval(() => {
        btnSend.innerText = `Gửi lại (${countdown}s)`;
        countdown--;
        if (countdown < 0) {
          clearInterval(interval);
          btnSend.disabled = false;
          btnSend.innerText = "Gửi mã OTP";
        }
      }, 1000);
    } else {
      msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-red-50 text-red-600 border border-red-200 block";
      msgBox.innerText = json.message || "Không thể gửi mã OTP!";
      btnSend.disabled = false;
      btnSend.innerText = "Gửi mã OTP";
    }
  } catch (err) {
    msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-red-50 text-red-600 border border-red-200 block";
    msgBox.innerText = "Lỗi kết nối tới máy chủ!";
    btnSend.disabled = false;
    btnSend.innerText = "Gửi mã OTP";
  }
}

/**
 * BƯỚC 2: BẤM "XÁC THỰC OTP & TẠO TÀI KHOẢN" (Gửi POST /api/v1/auth/register kèm OTP)
 */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('reg-fullname').value;
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const otp = document.getElementById('reg-otp').value;
  const msgBox = document.getElementById('register-msg');

  if (!otp || otp.length !== 6) {
    msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-red-50 text-red-600 border border-red-200 block";
    msgBox.innerText = "Vui lòng nhập đúng mã OTP gồm 6 chữ số từ Gmail!";
    return;
  }

  msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-blue-50 text-blue-600 border border-blue-200 block";
  msgBox.innerText = "Đang kiểm tra mã OTP và khởi tạo tài khoản...";

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, email, password, otp })
    });

    const json = await res.json();

    if (json.success) {
      msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-green-50 text-green-700 border border-green-200 block";
      msgBox.innerText = json.data || "Tạo tài khoản thành công! Bạn có thể chuyển sang tab Đăng nhập ngay bây giờ.";
      document.getElementById('modal-register-form').reset();
      setTimeout(() => switchTab('login'), 2000);
    } else {
      msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-red-50 text-red-600 border border-red-200 block";
      msgBox.innerText = json.message || "Xác thực OTP không thành công!";
    }
  } catch (err) {
    msgBox.className = "p-3 text-xs rounded-lg font-semibold bg-red-50 text-red-600 border border-red-200 block";
    msgBox.innerText = "Lỗi hệ thống khi tạo tài khoản!";
  }
}

/**
 * XỬ LÝ SUBMIT ĐĂNG NHẬP (Gửi POST /api/v1/auth/login)
 * Tối ưu tốc độ tức thì: Hiển thị phản hồi spinner ngay <16ms, đóng modal ngay và cập nhật tại chỗ không cần reload
 */
async function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorBox = document.getElementById('login-error-msg');
  const submitBtn = document.getElementById('btn-login-submit') || e.target.querySelector('button[type="submit"]');
  errorBox.classList.add('hidden');

  // Phản hồi trực quan tức thì <16ms
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Đang xác thực...</span>
    `;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const json = await res.json();

    if (json.success && json.data) {
      // 1. Đóng modal ngay lập tức để không gây gián đoạn mắt người dùng
      closeAuthModal();

      // 2. Lưu token & thông tin người dùng vào LocalStorage
      localStorage.setItem('accessToken', json.data.accessToken);
      localStorage.setItem('refreshToken', json.data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        id: json.data.id,
        username: json.data.username,
        email: json.data.email,
        fullName: json.data.fullName,
        avatarUrl: json.data.avatarUrl,
        role: json.data.role
      }));

      // 3. Nếu là Admin / Ban biên tập -> Chuyển hướng nhanh tức thì bằng replace
      const role = (json.data.role || '').toUpperCase();
      if (['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'].includes(role)) {
        window.location.replace('admin.html');
        return;
      }

      // 4. Độc giả thông thường: Cập nhật giao diện tại chỗ (In-Place Reactive), KHÔNG reload toàn trang
      if (typeof renderHeaderAuth === 'function') {
        renderHeaderAuth();
      }
      if (typeof initUserBookmarkCache === 'function') {
        initUserBookmarkCache();
      }
      if (window.toast && typeof window.toast.success === 'function') {
        window.toast.success(`Đăng nhập thành công! Chào mừng ${json.data.fullName || json.data.username}.`);
      } else if (typeof showToastNotification === 'function') {
        showToastNotification(`Đăng nhập thành công! Chào mừng ${json.data.fullName || json.data.username}.`);
      }
    } else {
      errorBox.innerText = json.message || "Tên đăng nhập hoặc mật khẩu không đúng!";
      errorBox.classList.remove('hidden');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>ĐĂNG NHẬP NGAY</span>';
      }
    }
  } catch (err) {
    errorBox.innerText = "Lỗi kết nối tới máy chủ. Vui lòng thử lại sau!";
    errorBox.classList.remove('hidden');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>ĐĂNG NHẬP NGAY</span>';
    }
  }
}

/**
 * GOOGLE SIGN-IN HANDLER (Phase 4)
 * Hỗ trợ cả Google Identity Services (GIS) chuẩn và Chế độ thử nghiệm 1-click
 */
async function processGoogleCredential(credential) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const json = await res.json();
    if (json.success && json.data) {
      // Đóng modal tức thì
      closeAuthModal();

      localStorage.setItem('accessToken', json.data.accessToken);
      localStorage.setItem('refreshToken', json.data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        id: json.data.id,
        username: json.data.username,
        email: json.data.email,
        fullName: json.data.fullName,
        avatarUrl: json.data.avatarUrl,
        role: json.data.role
      }));

      const role = (json.data.role || '').toUpperCase();
      if (['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'].includes(role)) {
        window.location.replace('admin.html');
      } else {
        if (typeof renderHeaderAuth === 'function') renderHeaderAuth();
        if (typeof initUserBookmarkCache === 'function') initUserBookmarkCache();
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success(`Đăng nhập Google thành công!`);
        }
      }
    } else {
      alert("Đăng nhập Google không thành công: " + (json.message || "Lỗi xác thực"));
    }
  } catch (err) {
    console.error("Google Auth Error:", err);
    alert("Không thể kết nối đến máy chủ xác thực Google!");
  }
}

/**
 * KHỞI TẠO NÚT GOOGLE IDENTITY SERVICES CHUẨN (GIỐNG TASK3)
 * Tự động render nút chính thức của Google, khi bấm sẽ mở popup chọn tài khoản Google thật 100%
 */
function setupGoogleIdentity() {
  const clientId = window.CONFIG?.GOOGLE_CLIENT_ID || '469382623867-5a89aqvp1e0gno6nirj7amko92jusrf0.apps.googleusercontent.com';
  const googleIdentityBtn = document.getElementById('googleIdentityBtn');
  const btnGoogleDirect = document.getElementById('btnGoogleDirect');

  if (window.google && window.google.accounts && window.google.accounts.id && googleIdentityBtn) {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (response.credential) {
            await processGoogleCredential(response.credential);
          }
        },
        auto_select: false
      });

      window.google.accounts.id.renderButton(googleIdentityBtn, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 360
      });

      if (btnGoogleDirect) {
        btnGoogleDirect.style.display = 'none';
      }
    } catch (err) {
      console.warn('Google Identity button initialization:', err);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Xử lý callback nếu Google redirect về URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('social_auth') === 'success') {
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    const username = urlParams.get('username');
    const email = urlParams.get('email');
    const role = urlParams.get('role');
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');
      localStorage.setItem('user', JSON.stringify({ username, email, role }));
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
    }
  } else if (urlParams.get('social_auth') === 'error') {
    alert("Đăng nhập Google thất bại: " + (urlParams.get('message') || "Vui lòng thử lại"));
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (urlParams.get('auth') === 'login') {
    openAuthModal('login');
  }

  // Khởi tạo Google Identity Services
  if (window.google && window.google.accounts) {
    setupGoogleIdentity();
  } else {
    window.addEventListener('load', () => {
      setTimeout(setupGoogleIdentity, 300);
    });
  }
});
