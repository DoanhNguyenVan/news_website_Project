# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Độc giả đại chúng (Readers):** Tiếp cận tin tức thời sự, kinh doanh, công nghệ, đời sống nhanh chóng; đọc bài viết định dạng chuẩn mực báo chí; tương tác bình luận và tham gia khảo sát ý kiến.
- **Phóng viên / Tác giả (Authors/Reporters):** Soạn thảo bài viết bằng Rich Text editor, nhập khẩu tài liệu Word (.docx), theo dõi tiến độ duyệt bài và phản hồi của ban biên tập.
- **Biên tập viên & Tổng biên tập (Editors & Editor-in-Chief):** Thẩm định, duyệt bài, từ chối kèm lý do, phân loại chuyên mục, ghim tin tiêu điểm (Spotlight) và tin nóng (Trending), quyết định xuất bản tin tức.
- **Quản trị viên cấp cao (Super Admin):** Quản lý cấu hình toàn hệ thống, tài khoản người dùng, phân quyền RBAC, chiến dịch quảng cáo và khảo sát bạn đọc; theo dõi KPI tòa soạn qua Dashboard thời gian thực.

## Product Purpose
Cổng thông tin báo điện tử hiện đại và hệ thống tòa soạn số (Editorial CMS) tốc độ cao, hỗ trợ quy trình xuất bản tin bài đa cấp độ với trải nghiệm người dùng tinh gọn, trang nhã và đáng tin cậy.

## Positioning
Hệ thống báo chí tích hợp quy trình tòa soạn thực tế (Draft -> Pending Approval -> Published/Rejected), phân quyền bảo mật chặt chẽ bằng JWT & OAuth2, xử lý nhanh tài liệu văn phòng và cung cấp thống kê số liệu minh bạch, chuẩn xác 100% từ cơ sở dữ liệu.

## Operating Context
- Hoạt động linh hoạt trên mọi kích thước màn hình (Desktop, Laptop, Tablet, Mobile).
- Tích hợp xác thực linh hoạt: Đăng nhập Google One-Tap/GIS chính thức và xác thực nội bộ với OTP email.
- Không gian làm việc quản trị theo phong cách SaaS Modern Blue chuyên nghiệp, độ tập trung cao.

## Capabilities and Constraints
- **Công nghệ nền tảng:** Spring Boot 3.x, Spring Security, Spring Data JPA, MySQL 8.0, Tailwind CSS, Vanilla JS, Chart.js.
- **Quyền hạn truy cập:** RBAC đa tầng (`SUPER_ADMIN`, `EDITOR_IN_CHIEF`, `EDITOR`, `AUTHOR`, `USER`).
- **Ràng buộc chất lượng:** Tuyệt đối không dùng số liệu ảo, không dùng các hiệu ứng hình ảnh mang tính trang trí giả tạo (AI slop, pulsing vô căn cứ, colored glow shadow).

## Brand Commitments
- **Tên:** NewsPortal
- **Bản sắc thương hiệu:** Chuẩn mực báo chí, tốc độ, sắc sảo, đáng tin cậy.
- **Màu sắc chủ đạo:** Royal Blue (`#2563EB`) kết hợp bảng màu trung tính sạch sẽ (`#FFFFFF`, `#F8FAFC`, `#0F172A`).

## Evidence on Hand
- Dự án Spring Boot hoàn chỉnh tại `src/main/` với các API RESTful đầy đủ chức năng.
- Giao diện tĩnh trực quan tại `src/main/resources/static/` gồm trang chủ, bài viết chi tiết, trang chuyên mục và trang quản trị CMS.

## Product Principles
1. **Chân thực & Khách quan:** Tôn trọng sự thật cả về nội dung báo chí lẫn số liệu báo cáo của tòa soạn.
2. **Phân cấp thị giác rõ ràng:** Cỡ chữ, khoảng cách lề và độ tương phản giúp mắt đọc lướt nhanh nội dung mà không bị mỏi.
3. **Tối giản & Trọng tâm:** Nội dung bài viết và luồng công việc tòa soạn là trung tâm; hạn chế mọi yếu tố trang trí gây phân tâm.
4. **Tính nhất quán cao:** Toàn bộ các trang từ độc giả đến quản trị viên đều dùng chung hệ quy chuẩn màu sắc, nút bấm và biểu mẫu.

## Accessibility & Inclusion
- Cấu trúc tiêu đề ngữ nghĩa tuần tự (H1 -> H2 -> H3) hỗ trợ đọc màn hình.
- Độ tương phản chữ (contrast ratio) đạt chuẩn WCAG AA trên nền sáng lẫn nền tối.
- Nhãn nút, ô nhập liệu và các modal đều hỗ trợ thao tác bằng bàn phím.

