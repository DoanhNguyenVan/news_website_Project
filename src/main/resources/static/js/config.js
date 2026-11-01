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
// Chuẩn hoá parse thời gian UTC từ backend TiDB/Render sang Date đối tượng theo giờ địa phương (Việt Nam UTC+7)
function parseUtcDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  let s = String(dateStr).trim();
  // Nếu là chuỗi ISO hoặc SQL datetime chưa có múi giờ, thêm 'Z' để browser tự chuyển sang múi giờ người dùng
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(dateString) {
  if (!dateString) return 'Mới đăng';
  try {
    const date = parseUtcDate(dateString);
    if (!date) return dateString;
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}
