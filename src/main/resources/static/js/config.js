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
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
