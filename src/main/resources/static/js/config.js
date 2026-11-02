/**
 * GLOBAL CONFIGURATION
 * Trỏ trực tiếp tới REST API Backend Spring Boot
 */
const CONFIG = {
  // Tự động sử dụng Host/IP/Domain hiện tại của trình duyệt thay vì hardcode localhost:8080
  API_BASE_URL: `${window.location.origin}/api/v1`, 
  GOOGLE_CLIENT_ID: "469382623867-5a89aqvp1e0gno6nirj7amko92jusrf0.apps.googleusercontent.com",
  USE_MOCK: false
};

/**
 * UTILITY FUNCTIONS
 */
// Chuẩn hoá parse thời gian từ backend Spring Boot sang Date đối tượng theo giờ địa phương (Việt Nam UTC+7)
function parseUtcDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  let s = String(dateStr).trim();
  // Chuẩn hóa khoảng trắng ' ' thành 'T' để mọi browser (Safari/iOS/Chrome) đọc chuẩn ISO
  s = s.replace(' ', 'T');
  // Không tự ý nối 'Z' vì thời gian từ backend Spring Boot đã theo chuẩn múi giờ Việt Nam (GMT+7).
  // Việc thêm 'Z' khiến trình duyệt hiểu nhầm là UTC và cộng dồn thêm 7 tiếng (thành giờ tương lai).
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(dateString) {
  if (!dateString) return 'Mới đăng';
  try {
    const date = parseUtcDate(dateString);
    if (!date) return dateString;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch (e) {
    return dateString;
  }
}

// Chuẩn hóa lấy Avatar đồng bộ toàn hệ thống:
// - Chỉ dùng avatar Google khi người dùng đăng nhập bằng Google (authProvider === 'GOOGLE').
// - Mọi trường hợp khác (tài khoản mật khẩu/local, chưa đăng nhập, v.v.): 100% dùng avatar mặc định xám trắng.
function getAppAvatarUrl(user) {
  if (!user) return '/images/default-avatar.png';
  const isGoogle = (user.authProvider || '').toUpperCase() === 'GOOGLE';
  if (isGoogle && user.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.trim().length > 0) {
    return user.avatarUrl.trim();
  }
  return '/images/default-avatar.png';
}

// Định dạng nội dung bình luận: Thoát mã HTML chống XSS và giữ nguyên toàn bộ dấu xuống dòng bằng <br>
function formatCommentContent(content) {
  if (!content) return '';
  const div = document.createElement('div');
  div.textContent = content;
  const safeText = div.innerHTML;
  return safeText.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
}
