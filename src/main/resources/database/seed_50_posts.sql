-- ====================================================================
-- NEWS PORTAL: SCRIPT KHỞI TẠO 50 BÀI VIẾT TIN TỨC CHUẨN BÁO CHÍ
-- ĐẦY ĐỦ 5 CHUYÊN MỤC, PHÂN BỔ VIEWS, SPOTLIGHT, TRENDING, TAGS & ĐỀ XUẤT
-- ====================================================================

USE `newsDB`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Đảm bảo cấu trúc các bảng bổ trợ tồn tại
CREATE TABLE IF NOT EXISTS `tags` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `slug` VARCHAR(60) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `post_tags` (
  `post_id` BIGINT NOT NULL,
  `tag_id` BIGINT NOT NULL,
  PRIMARY KEY (`post_id`, `tag_id`),
  CONSTRAINT `fk_post_tags_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reading_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `post_id` BIGINT NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_history_user_read` (`user_id`, `read_at`),
  INDEX `idx_history_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `post_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_bookmark_user_post` (`user_id`, `post_id`),
  INDEX `idx_bookmark_user` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_topic_preferences` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `category_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_category_pref` (`user_id`, `category_id`),
  INDEX `idx_user_pref` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Thêm dữ liệu Tags danh mục
INSERT INTO `tags` (`name`, `slug`) VALUES ('Trí tuệ nhân tạo (AI)', 'ai') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Công nghệ', 'cong-nghe') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Tuyển sinh', 'tuyen-sinh') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Khởi nghiệp', 'khoi-nghiep') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Sinh viên', 'sinh-vien') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Học bổng', 'hoc-bong') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Sức khỏe tâm lý', 'tam-ly') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Gen Z', 'gen-z') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Sống xanh', 'song-xanh') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Âm nhạc & Nghệ thuật', 'am-nhac') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Phóng sự điều tra', 'phong-su') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('An ninh mạng', 'an-ninh-mang') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Giáo dục', 'giao-duc') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Kinh tế & Tài chính', 'kinh-te') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
INSERT INTO `tags` (`name`, `slug`) VALUES ('Khoa học', 'khoa-hoc') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Xác định Author ID hợp lệ từ hệ thống
SET @default_author_id = (SELECT `id` FROM `users` WHERE `role` IN ('AUTHOR', 'EDITOR', 'SUPER_ADMIN') ORDER BY `id` ASC LIMIT 1);
SET @default_author_id = IFNULL(@default_author_id, 1);

-- 4. Chèn 50 bài viết tin tức chất lượng cao

-- Bài 1: Tuyển sinh đại học 2026: Đổi mới phương thức xét tuyển và bài toán chọn ngành thời số hóa
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Tuyển sinh đại học 2026: Đổi mới phương thức xét tuyển và bài toán chọn ngành thời số hóa',
  'tuyen-sinh-dai-hoc-2026-doi-moi-xet-tuyen',
  'Kỳ tuyển sinh đại học năm nay ghi nhận xu hướng gia tăng chỉ tiêu cho các ngành công nghệ, bán dẫn và trí tuệ nhân tạo, đồng thời siết chặt quy chế xét tuyển sớm.',
  '<p class=\"lead font-medium\">Trước làn sóng chuyển đổi số mạnh mẽ, các cơ sở giáo dục đại học trên cả nước đang chủ động tái cấu trúc chương trình đào tạo nhằm đáp ứng nhu cầu thực tế của thị trường lao động toàn cầu.</p>\n<h3>Tập trung vào chất lượng đầu vào và năng lực thực hành</h3>\n<p>Theo báo cáo từ Hội đồng Tuyển sinh, các trường đại học top đầu đang giảm dần sự phụ thuộc vào các phương thức xét tuyển học bạ đơn thuần, thay vào đó ưu tiên kết quả thi đánh giá năng lực, đánh giá tư duy kết hợp chứng chỉ quốc tế.</p>\n<blockquote>\"Mục tiêu giáo dục đại học ngày nay không chỉ là cung cấp kiến thức nền tảng mà là rèn luyện năng lực tự học suốt đời và khả năng làm chủ công nghệ mới.\"</blockquote>\n<p>Nhiều chuyên gia giáo dục khuyến nghị học sinh và phụ huynh cần nhìn nhận đúng xu thế nghề nghiệp trong 5-10 năm tới, tránh tâm lý chạy theo những ngành học \"thời thượng\" nhưng thiếu sự phù hợp với thế mạnh cá nhân.</p>',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Unsplash / Campus Life',
  'Minh Khôi (Ban Giáo dục)',
  'STANDARD',
  4,
  1,
  1,
  1,
  18450,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 24 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tuyen-sinh-dai-hoc-2026-doi-moi-xet-tuyen' AND t.`slug` = 'tuyen-sinh';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tuyen-sinh-dai-hoc-2026-doi-moi-xet-tuyen' AND t.`slug` = 'giao-duc';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tuyen-sinh-dai-hoc-2026-doi-moi-xet-tuyen' AND t.`slug` = 'sinh-vien';

-- Bài 2: Ký túc xá thông minh: Mô hình lưu trú hiện đại giải tỏa áp lực nhà trọ cho tân sinh viên
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Ký túc xá thông minh: Mô hình lưu trú hiện đại giải tỏa áp lực nhà trọ cho tân sinh viên',
  'ky-tuc-xa-thong-minh-mo-hinh-luu-tru-hien-dai',
  'Hệ thống kiểm soát ra vào bằng thẻ từ, căng tin thanh toán số và thư viện mở 24/7 đang biến ký túc xá sinh viên thành không gian sống văn minh, an toàn bậc nhất.',
  '<p class=\"lead font-medium\">Bước vào năm học mới, vấn đề tìm kiếm chỗ ở luôn là nỗi trăn trở hàng đầu của hàng vạn tân sinh viên và các bậc phụ huynh từ tỉnh xa lên thành phố.</p>\n<p>Để giải quyết bài toán này, mô hình \"Ký túc xá xanh và thông minh\" tại các làng đại học đã được nâng cấp đồng bộ. Mỗi phòng ở đều trang bị hệ thống điều hòa tiết kiệm năng lượng, bình nước nóng năng lượng mặt trời và kết nối Internet tốc độ cao.</p>\n<h3>Cộng đồng sinh viên gắn kết và an ninh tối đa</h3>\n<p>Không chỉ đáp ứng tiện nghi sinh hoạt, khuôn viên ký túc xá còn tích hợp sân thể thao đa năng, phòng tự học cách âm và không gian sinh hoạt câu lạc bộ, tạo môi trường rèn luyện toàn diện cho sinh viên nội trú.</p>',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Tư liệu Tòa soạn',
  'Thu Hà - K22',
  'STANDARD',
  3,
  0,
  1,
  1,
  12300,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 49 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'ky-tuc-xa-thong-minh-mo-hinh-luu-tru-hien-dai' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'ky-tuc-xa-thong-minh-mo-hinh-luu-tru-hien-dai' AND t.`slug` = 'giao-duc';

-- Bài 3: Học bổng tài năng trẻ 2026: Cơ hội vươn ra thế giới cho sinh viên nghiên cứu khoa học
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Học bổng tài năng trẻ 2026: Cơ hội vươn ra thế giới cho sinh viên nghiên cứu khoa học',
  'hoc-bong-tai-nang-tre-2026-co-hoi-nghien-cuu',
  'Hơn 200 suất học bổng toàn phần du học ngắn hạn và tài trợ dự án nghiên cứu khoa học vừa được công bố dành cho các sinh viên có thành tích xuất sắc.',
  '<p class=\"lead font-medium\">Chương trình ươm mầm tài năng trẻ nhằm khuyến khích sinh viên tham gia sâu vào các công trình nghiên cứu ứng dụng thực tiễn, đóng góp trực tiếp cho sự phát triển của cộng đồng.</p>\n<p>Các đề tài tập trung vào lĩnh vực chuyển đổi xanh, nông nghiệp công nghệ cao và giải pháp bảo vệ môi trường đô thị. Những công trình đạt giải sẽ được hỗ trợ kinh phí thử nghiệm và đăng ký sở hữu trí tuệ.</p>',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Quỹ Phát triển Giáo dục',
  'Đình Trọng',
  'STANDARD',
  4,
  0,
  0,
  1,
  8900,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 74 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hoc-bong-tai-nang-tre-2026-co-hoi-nghien-cuu' AND t.`slug` = 'hoc-bong';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hoc-bong-tai-nang-tre-2026-co-hoi-nghien-cuu' AND t.`slug` = 'khoa-hoc';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hoc-bong-tai-nang-tre-2026-co-hoi-nghien-cuu' AND t.`slug` = 'sinh-vien';

-- Bài 4: Mùa bảo vệ khóa luận: Khi đề tài của sinh viên bắt rễ từ bài toán thực tế của doanh nghiệp
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Mùa bảo vệ khóa luận: Khi đề tài của sinh viên bắt rễ từ bài toán thực tế của doanh nghiệp',
  'mua-bao-ve-khoa-luan-tot-nghiep-2026',
  'Thay vì những đề tài mang tính lý thuyết hàn lâm, khóa luận tốt nghiệp năm nay thể hiện tính ứng dụng cao khi giải quyết trực tiếp vướng mắc vận hành của các công ty.',
  '<p class=\"lead font-medium\">Không khí tại các hội đồng bảo vệ khóa luận tốt nghiệp những ngày qua luôn sôi nổi với sự tham gia của các chuyên gia đầu ngành và đại diện doanh nghiệp tuyển dụng.</p>\n<p>Nhiều sinh viên năm cuối đã nhận được lời mời làm việc chính thức ngay sau khi kết thúc buổi bảo vệ nhờ sản phẩm thử nghiệm hoàn thiện và tư duy giải quyết vấn đề sắc bén.</p>',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Truyền thông Đại học',
  'Hoàng Oanh',
  'STANDARD',
  3,
  0,
  0,
  1,
  6540,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 99 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mua-bao-ve-khoa-luan-tot-nghiep-2026' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mua-bao-ve-khoa-luan-tot-nghiep-2026' AND t.`slug` = 'giao-duc';

-- Bài 5: Ngày hội việc làm sinh viên 2026: Hơn 5.000 đầu việc chất lượng cao chờ đón cử nhân trẻ
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Ngày hội việc làm sinh viên 2026: Hơn 5.000 đầu việc chất lượng cao chờ đón cử nhân trẻ',
  'ngay-hoi-viec-lam-sinh-vien-2026',
  'Quy tụ hơn 80 doanh nghiệp trong và ngoài nước, Job Fair 2026 mở ra cánh cửa nghề nghiệp rộng mở cho sinh viên các ngành Công nghệ thông tin, Kinh tế và Ngoại ngữ.',
  '<p class=\"lead font-medium\">Với phương châm kết nối cung - cầu lao động hiệu quả, ngày hội mang đến các phiên phỏng vấn thử, sửa CV trực tiếp và cơ hội ký hợp đồng lao động ngay tại chỗ.</p>\n<p>Bên cạnh đó, các hội thảo chuyên đề về kỹ năng mềm, kỹ năng đàm phán lương và văn hóa doanh nghiệp cũng thu hút hàng ngàn bạn trẻ tham dự.</p>',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: BTC Job Fair',
  'Minh Khôi',
  'STANDARD',
  4,
  0,
  1,
  1,
  14200,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 124 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'ngay-hoi-viec-lam-sinh-vien-2026' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'ngay-hoi-viec-lam-sinh-vien-2026' AND t.`slug` = 'kinh-te';

-- Bài 6: Giảng đường không giấy: Cuộc cách mạng số hóa tài liệu học tập tại các trường đại học
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Giảng đường không giấy: Cuộc cách mạng số hóa tài liệu học tập tại các trường đại học',
  'giang-duong-khong-giay-so-hoa-tai-lieu',
  'Toàn bộ bài giảng điện tử, đề thi trực tuyến và giáo trình số được tích hợp trên nền tảng đám mây, giúp sinh viên truy cập học liệu mọi lúc, mọi nơi.',
  '<p class=\"lead font-medium\">Chủ trương \"xanh hóa giảng đường\" kết hợp chuyển đổi số đã giúp các trường đại học cắt giảm hàng tấn giấy in mỗi kỳ thi, đồng thời tăng tính minh bạch trong quản lý đào tạo.</p>\n<p>Sinh viên chỉ cần một chiếc máy tính bảng hoặc laptop để ghi chú, nộp bài tập và tương tác trực tiếp với giảng viên qua hệ thống học trực tuyến LMS.</p>',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Trung tâm CNTT Đào tạo',
  'Trần Nam',
  'STANDARD',
  3,
  0,
  0,
  1,
  5200,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 149 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'giang-duong-khong-giay-so-hoa-tai-lieu' AND t.`slug` = 'giao-duc';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'giang-duong-khong-giay-so-hoa-tai-lieu' AND t.`slug` = 'cong-nghe';

-- Bài 7: Mùa hè xanh 2026: Dấu chân tình nguyện của sinh viên trên những nẻo đường vùng cao
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Mùa hè xanh 2026: Dấu chân tình nguyện của sinh viên trên những nẻo đường vùng cao',
  'mua-he-xanh-2026-dau-chan-tinh-nguyen',
  'Vượt qua hàng trăm cây số đường rừng đèo dốc, các đội hình sinh viên tình nguyện mang ánh sáng tri thức và những cây cầu dân sinh đến với bà con đồng bào thiểu số.',
  '<p class=\"lead font-medium\">Chiến dịch Mùa hè xanh không chỉ là kỷ niệm đẹp thời sinh viên mà còn là trường học thực tiễn lớn rèn luyện bản lĩnh và lòng nhân ái cho thế hệ trẻ.</p>\n<p>Năm nay, các chiến sĩ tình nguyện đã xây dựng 12 phòng tin học cho trường tiểu học vùng cao, phổ cập kỹ năng an toàn mạng và tổ chức các lớp sinh hoạt hè bổ ích.</p>',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Đoàn Thanh niên Tình nguyện',
  'Mai Phương',
  'STANDARD',
  4,
  0,
  0,
  1,
  7400,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 174 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mua-he-xanh-2026-dau-chan-tinh-nguyen' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mua-he-xanh-2026-dau-chan-tinh-nguyen' AND t.`slug` = 'song-xanh';

-- Bài 8: Câu lạc bộ học thuật: Bệ phóng cho những đề án nghiên cứu khoa học tầm cỡ quốc tế
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Câu lạc bộ học thuật: Bệ phóng cho những đề án nghiên cứu khoa học tầm cỡ quốc tế',
  'cau-lac-bo-hoc-thuat-be-phong-nghien-cuu',
  'Không chỉ là nơi sinh hoạt ngoại khóa, các CLB học thuật sinh viên đang trở thành trung tâm ươm tạo các sáng kiến công nghệ và bài báo đăng trên tạp chí ISI/Scopus.',
  '<p class=\"lead font-medium\">Mô hình \"sinh viên hướng dẫn sinh viên\" cùng sự cố vấn của các giảng viên trẻ đã tạo nên môi trường tranh luận khoa học bình đẳng và cởi mở.</p>\n<p>Nhiều giải thưởng quốc tế về trí tuệ nhân tạo, thiết kế vi mạch và kinh tế xanh của sinh viên Việt Nam đã nảy mầm chính từ những buổi sinh hoạt CLB cuối tuần.</p>',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Ban Học thuật CLB',
  'Đình Trọng',
  'STANDARD',
  4,
  0,
  0,
  1,
  4890,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 199 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'cau-lac-bo-hoc-thuat-be-phong-nghien-cuu' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'cau-lac-bo-hoc-thuat-be-phong-nghien-cuu' AND t.`slug` = 'khoa-hoc';

-- Bài 9: Quản lý tài chính cá nhân cho sinh viên: Tích lũy và đầu tư từ những đồng lương làm thêm
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Quản lý tài chính cá nhân cho sinh viên: Tích lũy và đầu tư từ những đồng lương làm thêm',
  'quan-ly-tai-chinh-ca-nhan-cho-sinh-vien',
  'Học cách lập ngân sách chi tiêu 50/30/20, tránh bẫy mua sắm trả góp và xây dựng quỹ dự phòng tài chính từ những năm đầu giảng đường.',
  '<p class=\"lead font-medium\">Tự chủ tài chính khi rời xa vòng tay gia đình là bài học thực tế đầu tiên mà bất kỳ sinh viên nào cũng phải đối mặt khi bước chân vào cổng trường đại học.</p>\n<p>Các chuyên gia tài chính khuyến cáo sinh viên nên theo dõi chi tiêu hàng ngày qua ứng dụng, ưu tiên tiết kiệm ít nhất 10\% thu nhập và tuyệt đối cảnh giác với các hình thức vay tiêu dùng lãi suất cao.</p>',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Financial Times',
  'Lê Bảo',
  'STANDARD',
  3,
  0,
  0,
  1,
  9150,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 224 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'quan-ly-tai-chinh-ca-nhan-cho-sinh-vien' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'quan-ly-tai-chinh-ca-nhan-cho-sinh-vien' AND t.`slug` = 'kinh-te';

-- Bài 10: Tuyên dương 100 gương mặt "Sinh viên 5 tốt" toàn quốc: Bản lĩnh tri thức và khát vọng cống hiến
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Tuyên dương 100 gương mặt \"Sinh viên 5 tốt\" toàn quốc: Bản lĩnh tri thức và khát vọng cống hiến',
  'tuyen-duong-100-guong-mat-sinh-vien-5-tot',
  'Danh hiệu danh giá vinh danh những cá nhân tiêu biểu xuất sắc trong học tập, đạo đức, thể lực, tình nguyện và hội nhập quốc tế trong năm học vừa qua.',
  '<p class=\"lead font-medium\">Lễ trao giải diễn ra trang trọng với sự tham gia của các lãnh đạo bộ ngành và đông đảo cán bộ đoàn viên thanh niên cả nước.</p>\n<p>Những tấm gương được vinh danh đều là những hạt nhân tiêu biểu, minh chứng cho thế hệ trẻ giàu hoài bão, bản lĩnh và sẵn sàng hội nhập vào sân chơi trí tuệ toàn cầu.</p>',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Trung ương Hội Sinh viên',
  'Minh Khôi',
  'STANDARD',
  4,
  0,
  0,
  1,
  6100,
  'PUBLISHED',
  @default_author_id,
  1,
  DATE_SUB(NOW(), INTERVAL 249 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tuyen-duong-100-guong-mat-sinh-vien-5-tot' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tuyen-duong-100-guong-mat-sinh-vien-5-tot' AND t.`slug` = 'giao-duc';

-- Bài 11: Phóng sự: Góc khuất cày cuốc làm thêm và bài toán cân bằng học tập của sinh viên xa nhà
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Phóng sự: Góc khuất cày cuốc làm thêm và bài toán cân bằng học tập của sinh viên xa nhà',
  'phong-su-goc-khuat-lam-them-sinh-vien',
  'Những ca làm đêm kiệt sức tại cửa hàng tiện lợi, những đơn ship hàng mưa gió để đổi lấy tiền đóng học phí và nỗi lo điểm rèn luyện tuột dốc không phanh.',
  '<p class=\"lead font-medium\">2 giờ sáng, khi ký túc xá đã chìm vào giấc ngủ yên ắng, Hoàng (sinh viên năm 3) vẫn lặng lẽ lau dọn quầy pha chế tại một quán cà phê mở 24/7 ở trung tâm thành phố.</p>\n<h3>Áp lực cơm áo gạo tiền trên vai người trẻ</h3>\n<p>Mỗi tháng, số tiền sinh hoạt phí và tiền trọ lên tới hơn 4 triệu đồng. Để không phải xin tiền bố mẹ làm nông ở quê, Hoàng nhận làm thêm 2 ca mỗi ngày, tổng cộng gần 10 tiếng đồng hồ.</p>\n<blockquote>\"Có những buổi sáng ngồi trên giảng đường, mắt em cứ díp lại, đầu óc trống rỗng. Em biết việc học bị ảnh hưởng nhiều, nhưng nếu không làm thì tiền đâu đóng học phí kỳ sau?\" - Hoàng tâm sự.</blockquote>\n<p>Thực trạng này không còn là cá biệt. Khảo sát tại nhiều trường đại học cho thấy hơn 60\% sinh viên đang làm thêm, trong đó có không ít trường hợp phải nợ môn, bảo lưu hoặc thôi học vì quá tải thể lực và thời gian.</p>',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Phóng sự Thực địa',
  'Hải Đăng - Ban Phóng Sự',
  'LONGFORM',
  6,
  1,
  1,
  1,
  28900,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 34 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'phong-su-goc-khuat-lam-them-sinh-vien' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'phong-su-goc-khuat-lam-them-sinh-vien' AND t.`slug` = 'sinh-vien';

-- Bài 12: Điều tra: Bẫy lừa "việc nhẹ lương cao" bủa vây tân sinh viên trên mạng xã hội
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Điều tra: Bẫy lừa \"việc nhẹ lương cao\" bủa vây tân sinh viên trên mạng xã hội',
  'dieu-tra-bay-lua-viec-nhe-luong-cao',
  'Chiêu trò tuyển cộng tác viên giật đơn hàng Shopee, gõ mã captcha và dịch thuật văn bản với mức thù lao tiền triệu mỗi ngày đã đẩy nhiều sinh viên vào cảnh nợ nần.',
  '<p class=\"lead font-medium\">Đánh vào tâm lý muốn kiếm thêm thu nhập của các bạn sinh viên mới nhập học, các nhóm đối tượng lừa đảo tinh vi giăng bẫy khắp các hội nhóm Facebook và Telegram.</p>\n<p>Ban đầu, nạn nhân được trả tiền hoa hồng đầy đủ với các nhiệm vụ vài chục ngàn đồng để tạo niềm tin. Đến khi số tiền nạp vào lên tới hàng triệu, kẻ gian lập tức cắt đứt liên lạc và xóa dấu vết.</p>\n<p>Cơ quan chức năng cảnh báo các bạn trẻ cần tỉnh táo trước mọi lời mời chào làm việc trực tuyến yêu cầu đặt cọc tiền trước hoặc cung cấp thông tin tài khoản ngân hàng cá nhân.</p>',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: An ninh Mạng',
  'Tuấn Cường - Nhóm Điều tra',
  'STANDARD',
  5,
  0,
  1,
  1,
  22400,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 59 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dieu-tra-bay-lua-viec-nhe-luong-cao' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dieu-tra-bay-lua-viec-nhe-luong-cao' AND t.`slug` = 'an-ninh-mang';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dieu-tra-bay-lua-viec-nhe-luong-cao' AND t.`slug` = 'sinh-vien';

-- Bài 13: Thâm nhập lò luyện chứng chỉ cấp tốc: Bát nháo cam kết bao đỗ và thị trường văn bằng giả
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Thâm nhập lò luyện chứng chỉ cấp tốc: Bát nháo cam kết bao đỗ và thị trường văn bằng giả',
  'tham-nhap-lo-luyen-chung-chi-cap-toc',
  'Quảng cáo bao đỗ chuẩn đầu ra tiếng Anh, tin học quốc tế chỉ sau một tuần ôn luyện, thực chất đằng sau là đường dây thi hộ và làm giả hồ sơ thi cử tinh vi.',
  '<p class=\"lead font-medium\">Trong vai học viên cần chứng chỉ ngoại ngữ gấp để kịp nộp hồ sơ xét tốt nghiệp, phóng viên đã tiếp cận những \"đầu nậu\" chuyên cung cấp dịch vụ thi hộ trọn gói.</p>\n<p>Mức giá cho mỗi lần thi trót lọt dao động từ 8 đến 15 triệu đồng tùy theo loại chứng chỉ. Tuy nhiên, rủi ro bị đình chỉ học tập, hủy kết quả thi và lưu vết kỷ luật trong hồ sơ là cái giá đắt mà nhiều sinh viên đã phải trả.</p>',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Điều tra Dân trí',
  'Hải Đăng - Tuấn Cường',
  'STANDARD',
  5,
  0,
  0,
  1,
  16700,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 72 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tham-nhap-lo-luyen-chung-chi-cap-toc' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tham-nhap-lo-luyen-chung-chi-cap-toc' AND t.`slug` = 'giao-duc';

-- Bài 14: Hành trình giữ rừng của những người trẻ: Bám ngàn vì màu xanh của đại ngàn Trường Sơn
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Hành trình giữ rừng của những người trẻ: Bám ngàn vì màu xanh của đại ngàn Trường Sơn',
  'hanh-trinh-giu-rung-cua-nhung-nguoi-tre',
  'Gác lại sự ồn ào của phố thị, những kiểm lâm viên và tình nguyện viên gen Z chọn ăn ngủ giữa rừng sâu để bảo vệ những cánh rừng nguyên sinh và động vật quý hiếm.',
  '<p class=\"lead font-medium\">Bữa cơm giữa rừng chỉ có rau rừng, cá suối và gói lương khô ăn vội, nhưng ánh mắt của những kiểm lâm viên trẻ tuổi luôn rạng ngời tình yêu thiên nhiên.</p>\n<p>Họ đã cùng nhau tháo gỡ hàng ngàn bẫy thú trái phép, tuần tra xuyên rừng qua những cung đường trơn trượt hiểm trở, góp phần giữ bình yên cho những loài linh trưởng quý hiếm đứng trước nguy cơ tuyệt chủng.</p>',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Vườn Quốc gia Bạch Mã',
  'Việt Anh',
  'PHOTO_ESSAY',
  6,
  0,
  0,
  1,
  11200,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 97 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hanh-trinh-giu-rung-cua-nhung-nguoi-tre' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hanh-trinh-giu-rung-cua-nhung-nguoi-tre' AND t.`slug` = 'song-xanh';

-- Bài 15: Phía sau những bản đồ án triệu view: Đêm trắng và giọt nước mắt của sinh viên kiến trúc
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Phía sau những bản đồ án triệu view: Đêm trắng và giọt nước mắt của sinh viên kiến trúc',
  'phia-sau-do-an-trieu-view-kien-truc',
  'Mỗi mô hình tinh xảo xuất hiện lộng lẫy trên mạng xã hội là kết quả của hàng chục đêm thức trắng cắt mô hình, dựng 3D và vô số lần bị thầy cô bác bỏ làm lại từ đầu.',
  '<p class=\"lead font-medium\">Tại các xưởng đồ án kiến trúc, mùi keo dán, mạt cưa và cà phê đặc quánh tạo nên bầu không khí làm việc căng thẳng đến nghẹt thở những tuần cuối kỳ.</p>\n<p>Dù áp lực khắc nghiệt, chính ngọn lửa đam mê sáng tạo không gian sống cho con người đã giữ chân các kiến trúc sư tương lai bền bỉ với con đường mình đã chọn.</p>',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Xưởng Kiến trúc ĐH Mỹ thuật',
  'Quỳnh Trang',
  'STANDARD',
  4,
  0,
  0,
  1,
  13800,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 122 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'phia-sau-do-an-trieu-view-kien-truc' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'phia-sau-do-an-trieu-view-kien-truc' AND t.`slug` = 'sinh-vien';

-- Bài 16: Đạo văn trong kỷ nguyên AI: Lằn ranh mong manh giữa tham khảo ý tưởng và sao chép gian lận
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Đạo văn trong kỷ nguyên AI: Lằn ranh mong manh giữa tham khảo ý tưởng và sao chép gian lận',
  'dao-van-trong-ky-nguyen-ai-ranh-gioi',
  'Sự phổ cập của ChatGPT và các mô hình sinh văn bản đang đặt các hội đồng chấm thi trước thách thức phân định sản phẩm trí tuệ thực thụ của người học.',
  '<p class=\"lead font-medium\">Chỉ cần một vài câu lệnh ngắn gọn, người học đã có thể tạo ra một bài tiểu luận dài hàng chục trang với câu từ trôi chảy và số liệu trích dẫn đầy đủ.</p>\n<p>Tuy nhiên, sự thiếu hụt tư duy phản biện và hiện tượng \"ảo giác thông tin\" (hallucination) của AI đang khiến nhiều bài tập nộp cho giảng viên chứa đựng sai sót ngớ ngẩn về mặt khoa học.</p>',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: AI Research Lab',
  'Hải Đăng',
  'STANDARD',
  5,
  0,
  0,
  1,
  15400,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 147 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dao-van-trong-ky-nguyen-ai-ranh-gioi' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dao-van-trong-ky-nguyen-ai-ranh-gioi' AND t.`slug` = 'ai';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dao-van-trong-ky-nguyen-ai-ranh-gioi' AND t.`slug` = 'giao-duc';

-- Bài 17: Tiếng thở dài ở xóm trọ nghèo: Nỗi lo tăng giá điện nước khi mùa nắng nóng cận kề
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Tiếng thở dài ở xóm trọ nghèo: Nỗi lo tăng giá điện nước khi mùa nắng nóng cận kề',
  'tieng-tho-dai-xom-tro-ngheo-gia-dien-nuoc',
  'Nhiều chủ trọ vẫn tự ý áp giá điện 4.000 - 5.000 đồng/kWh và thu tiền nước định mức vô lý, khiến gánh nặng chi phí của người lao động và sinh viên nghèo càng thêm đè nặng.',
  '<p class=\"lead font-medium\">Trong căn phòng trọ ẩm thấp chưa đầy 12m2 lợp mái tôn, nhiệt độ mùa hè có thời điểm lên tới gần 40 độ C, nhưng chiếc quạt máy cũ kỹ chỉ dám bật cầm chừng.</p>\n<p>Dù cơ quan quản lý đã có quy định rõ ràng về việc cấp định mức giá điện sinh hoạt cho người thuê trọ, nhưng việc triển khai trên thực tế tại nhiều quận huyện vẫn còn gặp nhiều rào cản từ phía chủ nhà.</p>',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Ký sự Phố thị',
  'Hồng Đăng',
  'STANDARD',
  4,
  0,
  0,
  1,
  9800,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 172 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tieng-tho-dai-xom-tro-ngheo-gia-dien-nuoc' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tieng-tho-dai-xom-tro-ngheo-gia-dien-nuoc' AND t.`slug` = 'sinh-vien';

-- Bài 18: Chiến dịch giải cứu động vật hoang dã: Những chuyến băng rừng xuyên đêm vì sự sống tự nhiên
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Chiến dịch giải cứu động vật hoang dã: Những chuyến băng rừng xuyên đêm vì sự sống tự nhiên',
  'chien-dich-giai-cuu-dong-vat-hoang-da',
  'Đằng sau những cá thể tê tê, rùa núi và voọc được tái thả về tự nhiên là chuỗi ngày ròng rã chăm sóc phục hồi chức năng của những bác sĩ thú y trẻ tuổi.',
  '<p class=\"lead font-medium\">Mỗi ca cứu hộ là một cuộc chạy đua với thời gian để giành lại sự sống cho những cá thể động vật kiệt sức sau khi bị săn bắt trái phép.</p>\n<p>Sự tận tụy của đội ngũ bảo tồn tình nguyện đã thắp lên niềm tin vào nỗ lực phục hồi hệ sinh thái tự nhiên tại các khu bảo tồn thiên nhiên quốc gia.</p>',
  'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Trung tâm Cứu hộ ĐVHD',
  'Việt Anh',
  'STANDARD',
  5,
  0,
  0,
  1,
  8200,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 197 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'chien-dich-giai-cuu-dong-vat-hoang-da' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'chien-dich-giai-cuu-dong-vat-hoang-da' AND t.`slug` = 'song-xanh';

-- Bài 19: Từ phòng thí nghiệm hạt nhân: Người trẻ Việt giải bài toán chuyển dịch năng lượng sạch
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Từ phòng thí nghiệm hạt nhân: Người trẻ Việt giải bài toán chuyển dịch năng lượng sạch',
  'phong-thi-nghiem-hat-nhan-nguoi-tre-viet',
  'Những kỹ sư, nhà vật lý hạt nhân thế hệ 9x và 2000 đang lặng lẽ cống hiến cho các dự án nghiên cứu lò phản ứng thế hệ mới phục vụ y tế và công nghiệp sạch.',
  '<p class=\"lead font-medium\">Bên trong viện nghiên cứu hạt nhân Đà Lạt, công việc kiểm tra mẫu đồng vị phóng xạ và vận hành thiết bị đo chuẩn diễn ra với sự nghiêm ngặt tuyệt đối.</p>\n<p>Họ là những người đặt nền móng cho nền khoa học công nghệ hạt nhân hòa bình của Việt Nam, mở ra triển vọng to lớn trong điều trị ung thư và bảo quản nông sản xuất khẩu.</p>',
  'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Viện Nghiên cứu Hạt nhân',
  'Đình Trọng',
  'STANDARD',
  5,
  0,
  0,
  1,
  10400,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 222 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'phong-thi-nghiem-hat-nhan-nguoi-tre-viet' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'phong-thi-nghiem-hat-nhan-nguoi-tre-viet' AND t.`slug` = 'khoa-hoc';

-- Bài 20: Một ngày theo chân bác sĩ nội trú tại phòng cấp cứu: Ranh giới sinh tử không có chỗ cho sai sót
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Một ngày theo chân bác sĩ nội trú tại phòng cấp cứu: Ranh giới sinh tử không có chỗ cho sai sót',
  'mot-ngay-theo-chan-bac-si-noi-tru-cap-cuu',
  'Tiếng còi xe cấp cứu rú liên hồi, những bước chân chạy vội và ánh mắt tập trung cao độ trong các ca hồi sức tim phổi xuyên màn đêm.',
  '<p class=\"lead font-medium\">Làm việc liên tục 24 tiếng trong một ca trực cấp cứu là bài kiểm tra thể lực và tinh thần khắc nghiệt nhất đối với các bác sĩ nội trú trẻ.</p>\n<p>Nhưng trên tất cả, khoảnh khắc nghe lại tiếng tim đập trở lại của bệnh nhân chính là phần thưởng vô giá bù đắp mọi mệt mỏi của chiếc áo blouse trắng.</p>',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Bệnh viện Đa khoa',
  'Mai Phương',
  'PHOTO_ESSAY',
  6,
  0,
  0,
  1,
  14700,
  'PUBLISHED',
  @default_author_id,
  2,
  DATE_SUB(NOW(), INTERVAL 247 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mot-ngay-theo-chan-bac-si-noi-tru-cap-cuu' AND t.`slug` = 'phong-su';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mot-ngay-theo-chan-bac-si-noi-tru-cap-cuu' AND t.`slug` = 'sinh-vien';

-- Bài 21: Trí tuệ nhân tạo và tương lai việc làm: Sinh viên nên lo sợ hay chủ động nâng cấp bản thân?
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Trí tuệ nhân tạo và tương lai việc làm: Sinh viên nên lo sợ hay chủ động nâng cấp bản thân?',
  'tri-tue-nhan-tao-va-tuong-lai-viec-lam',
  'Thay vì bi quan trước viễn cảnh AI thay thế con người, thế hệ trẻ cần nhìn nhận đây là cơ hội vàng để định vị lại giá trị độc bản của tư duy sáng tạo và lòng trắc ẩn.',
  '<p class=\"lead font-medium\">Mỗi cuộc cách mạng công nghệ đều đi kèm nỗi sợ hãi về làn sóng thất nghiệp hàng loạt. Nhưng lịch sử đã chứng minh: công nghệ không làm biến mất công việc, nó chỉ thay đổi bản chất của công việc.</p>\n<h3>Kỹ năng con người: Pháo đài không thể đánh bại của trí tuệ</h3>\n<p>Thuật toán có thể viết code trong tích tắc, vẽ tranh siêu thực hay tổng hợp hàng ngàn trang tài liệu. Nhưng nó không thể thấu cảm nỗi đau của người khác, không thể đưa ra những quyết định đạo đức phức tạp và không thể thắp lên ngọn lửa truyền cảm hứng.</p>\n<blockquote>\"Những ai biết cách hợp tác cùng AI sẽ thay thế những người từ chối học cách sử dụng nó.\"</blockquote>\n<p>Để tồn tại và tỏa sáng trong kỷ nguyên mới, sinh viên cần trau dồi 3 năng lực cốt lõi: Tư duy phản biện, Trí tuệ cảm xúc (EQ) và Khả năng học tập thích ứng linh hoạt.</p>',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Unsplash Tech',
  'TS. Nguyễn Văn Tuấn',
  'STANDARD',
  5,
  1,
  1,
  1,
  24500,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 32 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tri-tue-nhan-tao-va-tuong-lai-viec-lam' AND t.`slug` = 'ai';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tri-tue-nhan-tao-va-tuong-lai-viec-lam' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tri-tue-nhan-tao-va-tuong-lai-viec-lam' AND t.`slug` = 'giao-duc';

-- Bài 22: Văn hóa "chữa lành" của Gen Z: Nhu cầu thấu cảm chính đáng hay biểu hiện của áp lực quá tải?
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Văn hóa \"chữa lành\" của Gen Z: Nhu cầu thấu cảm chính đáng hay biểu hiện của áp lực quá tải?',
  'van-hoa-chua-lanh-cua-gen-z',
  'Từ những chuyến đi du lịch một mình, các workshop làm gốm đến việc gặp gỡ chuyên gia tâm lý, giới trẻ đang cởi mở hơn bao giờ hết với việc chăm sóc sức khỏe tinh thần.',
  '<p class=\"lead font-medium\">Thế hệ lớn lên cùng Internet và mạng xã hội phải đối mặt với áp lực vô hình từ sự so sánh liên tục và tốc độ sống dồn dập chưa từng có.</p>\n<p>Chữa lành không phải là trốn chạy thực tế, mà là học cách dừng lại đúng lúc để tái tạo năng lượng bên trong, trước khi tiếp tục hành trình khẳng định bản thân.</p>',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Mindful Living',
  'Khánh Linh',
  'STANDARD',
  4,
  0,
  1,
  1,
  19800,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 57 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'van-hoa-chua-lanh-cua-gen-z' AND t.`slug` = 'tam-ly';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'van-hoa-chua-lanh-cua-gen-z' AND t.`slug` = 'gen-z';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'van-hoa-chua-lanh-cua-gen-z' AND t.`slug` = 'song-xanh';

-- Bài 23: Đừng để tấm bằng cử nhân trở thành mục tiêu duy nhất của những năm tháng thanh xuân
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Đừng để tấm bằng cử nhân trở thành mục tiêu duy nhất của những năm tháng thanh xuân',
  'dung-de-tam-bang-tro-thanh-muc-tieu-duy-nhat',
  'Điểm số GPA cao là lợi thế, nhưng những trải nghiệm xã hội, tình bạn đẹp và khả năng đứng dậy sau vấp ngã mới là hành trang vô giá cho cuộc đời dài phía trước.',
  '<p class=\"lead font-medium\">Trường đại học không chỉ là nơi trao tặng chứng chỉ tốt nghiệp, mà là môi trường thử nghiệm an toàn nhất để người trẻ dám sai, dám sửa và tìm ra đam mê thực sự.</p>\n<p>Hãy bước ra khỏi bốn bức tường giảng đường, dấn thân vào các hoạt động cộng đồng và mở rộng tầm nhìn của bạn ra ngoài những trang sách giáo trình.</p>',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Đại học Quốc gia',
  'Trần Nam',
  'STANDARD',
  4,
  0,
  0,
  1,
  11400,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 82 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dung-de-tam-bang-tro-thanh-muc-tieu-duy-nhat' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dung-de-tam-bang-tro-thanh-muc-tieu-duy-nhat' AND t.`slug` = 'giao-duc';

-- Bài 24: Hội chứng sợ bỏ lỡ (FOMO) trên mạng xã hội: Khi chúng ta so sánh hậu trường của mình với ánh đèn sân khấu của người khác
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Hội chứng sợ bỏ lỡ (FOMO) trên mạng xã hội: Khi chúng ta so sánh hậu trường của mình với ánh đèn sân khấu của người khác',
  'hoi-chung-fomo-tren-mang-xa-hoi',
  'Nhìn bạn bè khoe nhận học bổng, mua xe mới hay đi du lịch sang chảnh, cảm giác bất an và nghi ngờ giá trị bản thân đang gặm nhấm tâm lý của không ít người trẻ.',
  '<p class=\"lead font-medium\">Bản chất của mạng xã hội là nơi mọi người chọn lọc những khoảnh khắc rực rỡ nhất để phô diễn. Không ai khoe những đêm khóc thầm hay những thất bại cay đắng.</p>\n<p>Học cách tắt thông báo, trân trọng tiến trình cá nhân và tập trung vào mục tiêu của chính mình là liều thuốc hữu hiệu nhất để thoát khỏi cái bẫy so sánh độc hại này.</p>',
  'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Social Pulse',
  'Khánh Linh',
  'STANDARD',
  4,
  0,
  0,
  1,
  15900,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 107 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hoi-chung-fomo-tren-mang-xa-hoi' AND t.`slug` = 'tam-ly';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hoi-chung-fomo-tren-mang-xa-hoi' AND t.`slug` = 'gen-z';

-- Bài 25: Văn hóa đọc trong kỷ nguyên TikTok: Đọc nhanh, đọc lướt hay đọc sâu để tích lũy tri thức bền vững?
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Văn hóa đọc trong kỷ nguyên TikTok: Đọc nhanh, đọc lướt hay đọc sâu để tích lũy tri thức bền vững?',
  'van-hoa-doc-trong-ky-nguyen-tiktok',
  'Khi các video 30 giây rèn luyện bộ não quen với sự kích thích tức thì, khả năng kiên nhẫn đọc trọn vẹn một cuốn sách học thuật đang trở thành năng lực quý hiếm.',
  '<p class=\"lead font-medium\">Đọc sách sâu giúp kích hoạt mạng lưới tư duy liên tưởng, nuôi dưỡng sự tĩnh lặng nội tâm và phát triển năng lực ngôn ngữ đa tầng.</p>\n<p>Hãy bắt đầu bằng việc dành ra 20 phút mỗi tối đọc sách giấy mà không có sự làm phiền của điện thoại thông minh để xây dựng lại thói quen tư duy tập trung sâu.</p>',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Thư viện Thành phố',
  'Hoàng Oanh',
  'STANDARD',
  4,
  0,
  0,
  1,
  7800,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 120 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'van-hoa-doc-trong-ky-nguyen-tiktok' AND t.`slug` = 'tam-ly';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'van-hoa-doc-trong-ky-nguyen-tiktok' AND t.`slug` = 'giao-duc';

-- Bài 26: Khởi nghiệp đại học: Dám thất bại để trưởng thành hay chỉ là cơn sốt phong trào?
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Khởi nghiệp đại học: Dám thất bại để trưởng thành hay chỉ là cơn sốt phong trào?',
  'khoi-nghiep-dai-hoc-dam-that-bai-truong-thanh',
  'Khởi nghiệp không trải hoa hồng như các bài thuyết trình gọi vốn. Đằng sau những tấm gương thành công là hàng trăm dự án tan rã vì thiếu hiểu biết về tài chính và vận hành.',
  '<p class=\"lead font-medium\">Tinh thần doanh nhân là điều đáng khuyến khích, nhưng sinh viên cần trang bị đầy đủ kiến thức pháp lý, kỹ năng làm việc nhóm và nghiên cứu thị trường trước khi lao vào cuộc chơi mạo hiểm.</p>\n<p>Thất bại của một dự án thời sinh viên có thể là bài học đắt giá nhất giúp bạn định hình tư duy quản trị vững vàng trong tương lai.</p>',
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Startup Hub',
  'Lê Bảo',
  'STANDARD',
  5,
  0,
  0,
  1,
  8900,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 145 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'khoi-nghiep-dai-hoc-dam-that-bai-truong-thanh' AND t.`slug` = 'khoi-nghiep';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'khoi-nghiep-dai-hoc-dam-that-bai-truong-thanh' AND t.`slug` = 'kinh-te';

-- Bài 27: Quyền riêng tư dữ liệu cá nhân: Chúng ta đang đánh đổi thông tin lấy sự tiện lợi như thế nào?
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Quyền riêng tư dữ liệu cá nhân: Chúng ta đang đánh đổi thông tin lấy sự tiện lợi như thế nào?',
  'quyen-rieng-tu-du-lieu-ca-nhan-thoi-so',
  'Mỗi cú click chuột, mỗi lần cấp quyền truy cập camera hay định vị GPS đều là mảnh ghép giúp các tập đoàn công nghệ xây dựng hồ sơ hành vi chính xác đến rùng mình về bạn.',
  '<p class=\"lead font-medium\">Khi một dịch vụ trực tuyến hoàn toàn miễn phí, chính thông tin cá nhân và sự chú ý của bạn là món hàng được đem ra giao dịch.</p>\n<p>Người dùng hiện đại cần nâng cao ý thức về an toàn thông tin số, chủ động quản lý các quyền ứng dụng và kiểm soát dấu chân kỹ thuật số của mình.</p>',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Cyber Security Hub',
  'Tuấn Cường',
  'STANDARD',
  4,
  0,
  0,
  1,
  11200,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 170 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'quyen-rieng-tu-du-lieu-ca-nhan-thoi-so' AND t.`slug` = 'an-ninh-mang';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'quyen-rieng-tu-du-lieu-ca-nhan-thoi-so' AND t.`slug` = 'cong-nghe';

-- Bài 28: Sự chuyển dịch của mô hình làm việc kết hợp (Hybrid Work): Lợi thế và thách thức cho nhân sự trẻ
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Sự chuyển dịch của mô hình làm việc kết hợp (Hybrid Work): Lợi thế và thách thức cho nhân sự trẻ',
  'mo-hinh-lam-viec-hybrid-work-nhan-su-tre',
  'Không còn bị bó buộc tại văn phòng 8 tiếng mỗi ngày, nhân sự trẻ có thêm tự do nhưng cũng phải đối mặt với nguy cơ mờ nhạt ranh giới giữa công việc và đời sống cá nhân.',
  '<p class=\"lead font-medium\">Làm việc linh hoạt đòi hỏi tính kỷ luật bản thân cao độ và kỹ năng giao tiếp bất đồng bộ (asynchronous communication) hiệu quả.</p>\n<p>Các tổ chức tiến bộ đang đầu tư mạnh mẽ vào các công cụ cộng tác trực tuyến để duy trì văn hóa gắn kết đồng đội dù ở bất kỳ đâu.</p>',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Workplace Design',
  'Minh Khôi',
  'STANDARD',
  4,
  0,
  0,
  1,
  9400,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 195 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mo-hinh-lam-viec-hybrid-work-nhan-su-tre' AND t.`slug` = 'kinh-te';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mo-hinh-lam-viec-hybrid-work-nhan-su-tre' AND t.`slug` = 'gen-z';

-- Bài 29: Hòa hợp đa thế hệ nơi công sở: Gen Z làm thế nào để khẳng định cá tính mà không tạo xung đột?
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Hòa hợp đa thế hệ nơi công sở: Gen Z làm thế nào để khẳng định cá tính mà không tạo xung đột?',
  'hoa-hop-da-the-he-noi-cong-so',
  'Sự thẳng thắn, khao khát bình đẳng và coi trọng work-life balance của thế hệ trẻ đôi khi bị nhìn nhận là thiếu cam kết dưới lăng kính của các thế hệ đi trước.',
  '<p class=\"lead font-medium\">Lắng nghe tích cực và tôn trọng kinh nghiệm thực tế của các tiền bối là chìa khóa vàng giúp nhân sự trẻ xây dựng uy tín chuyên môn vững chắc.</p>\n<p>Một môi trường làm việc lý tưởng là nơi thế hệ giàu kinh nghiệm truyền đạt sự cẩn trọng và thế hệ trẻ thổi vào luồng gió đổi mới sáng tạo không ngừng.</p>',
  'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Career Development',
  'Trần Nam',
  'STANDARD',
  4,
  0,
  0,
  1,
  12600,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 220 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hoa-hop-da-the-he-noi-cong-so' AND t.`slug` = 'gen-z';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'hoa-hop-da-the-he-noi-cong-so' AND t.`slug` = 'kinh-te';

-- Bài 30: Nghệ thuật của sự chậm lại: Giữa guồng quay hối hả, học cách dừng lại để đi xa hơn
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Nghệ thuật của sự chậm lại: Giữa guồng quay hối hả, học cách dừng lại để đi xa hơn',
  'nghe-thuat-cua-su-cham-lai',
  'Không phải lúc nào tăng tốc cũng mang lại hiệu quả cao nhất. Đôi khi, một khoảng lặng tĩnh tâm chính là bước đệm cần thiết để nhìn nhận lại hướng đi đúng đắn.',
  '<p class=\"lead font-medium\">Sự bận rộn liên miên đôi khi chỉ là vỏ bọc che đậy sự thiếu định hướng và nỗi sợ hãi đối diện với chính mình trong tĩnh lặng.</p>\n<p>Dành cho mình một buổi chiều không màn hình, đi dạo dưới bóng cây và trò chuyện chân tình cùng người thân sẽ giúp bạn nạp đầy năng lượng sáng tạo nguyên bản.</p>',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Nature & Peace',
  'Khánh Linh',
  'STANDARD',
  3,
  0,
  0,
  1,
  6300,
  'PUBLISHED',
  @default_author_id,
  3,
  DATE_SUB(NOW(), INTERVAL 245 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'nghe-thuat-cua-su-cham-lai' AND t.`slug` = 'tam-ly';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'nghe-thuat-cua-su-cham-lai' AND t.`slug` = 'song-xanh';

-- Bài 31: Trào lưu sống xanh Zero-Waste: Khi người trẻ kiên trì từ chối đồ nhựa dùng một lần
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Trào lưu sống xanh Zero-Waste: Khi người trẻ kiên trì từ chối đồ nhựa dùng một lần',
  'trao-luu-song-xanh-zero-waste-nguoi-tre',
  'Mang bình nước cá nhân, dùng hộp cơm bã mía và tham gia các ngày hội đổi rác lấy cây xanh đang trở thành phong cách sống thời thượng của giới trẻ thành thị.',
  '<p class=\"lead font-medium\">Không chỉ dừng lại ở khẩu hiệu tuyên truyền, làn sóng bảo vệ môi trường đã chuyển hóa thành những hành động cụ thể, bền bỉ mỗi ngày trong đời sống giới trẻ.</p>\n<h3>Thay đổi bắt đầu từ những thói quen giản dị</h3>\n<p>Tại nhiều quán cà phê quanh các trường đại học, số lượng sinh viên mang theo ly giữ nhiệt cá nhân để được giảm giá đã tăng gấp ba lần so với năm ngoái.</p>\n<p>Họ hiểu rằng hành trình bảo vệ hành tinh xanh không cần một vài người thực hành hoàn hảo, mà cần hàng triệu người cùng thực hành không hoàn hảo mỗi ngày.</p>',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Eco Life Vietnam',
  'Hoàng Yến',
  'STANDARD',
  4,
  1,
  1,
  1,
  17200,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 30 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'trao-luu-song-xanh-zero-waste-nguoi-tre' AND t.`slug` = 'song-xanh';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'trao-luu-song-xanh-zero-waste-nguoi-tre' AND t.`slug` = 'gen-z';

-- Bài 32: Âm nhạc Indie Việt: Khi những giai điệu mộc mạc chinh phục trái tim hàng triệu người nghe
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Âm nhạc Indie Việt: Khi những giai điệu mộc mạc chinh phục trái tim hàng triệu người nghe',
  'am-nhac-indie-viet-chinh-phuc-khan-gia',
  'Không cần chiến dịch quảng bá rầm rộ hay kỹ xảo phòng thu hào nhoáng, những ca từ chân thành viết về tuổi trẻ và tình yêu mộc mạc vẫn tạo nên sức lan tỏa mãnh liệt.',
  '<p class=\"lead font-medium\">Từ những đêm nhạc ấm cúng trong quán cà phê nhỏ, các nghệ sĩ Indie Việt Nam đã tự tin bước lên những sân khấu âm nhạc ngoài trời quy mô hàng vạn khán giả.</p>\n<p>Sự đón nhận nồng nhiệt của công chúng trẻ cho thấy nhu cầu tìm kiếm những giá trị cảm xúc chân thật, nguyên bản trong đời sống nghệ thuật đương đại.</p>',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Sound of Youth',
  'Thanh Hằng',
  'STANDARD',
  4,
  0,
  1,
  1,
  21500,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 55 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'am-nhac-indie-viet-chinh-phuc-khan-gia' AND t.`slug` = 'am-nhac';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'am-nhac-indie-viet-chinh-phuc-khan-gia' AND t.`slug` = 'gen-z';

-- Bài 33: Nghệ thuật đường phố Graffiti: Ranh giới mong manh giữa bôi bẩn và biểu đạt mỹ thuật
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Nghệ thuật đường phố Graffiti: Ranh giới mong manh giữa bôi bẩn và biểu đạt mỹ thuật',
  'nghe-thuat-duong-pho-graffiti-ranh-gioi',
  'Cần một quy hoạch không gian nghệ thuật công cộng bài bản để các nghệ sĩ trẻ thỏa sức sáng tạo mà không xâm phạm các di tích và công trình kiến trúc đô thị.',
  '<p class=\"lead font-medium\">Những bức bích họa rực rỡ tại các khu phố nghệ thuật đã biến những bức tường xám xịt cũ kỹ thành điểm check-in văn hóa độc đáo thu hút du khách quốc tế.</p>\n<p>Tuy nhiên, các hành vi vẽ bậy bừa bãi lên các công trình giao thông công cộng cần bị xử lý nghiêm minh để trả lại vẻ đẹp văn minh cho đô thị.</p>',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Urban Art Guide',
  'Quỳnh Trang',
  'PHOTO_ESSAY',
  5,
  0,
  0,
  1,
  8900,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 80 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'nghe-thuat-duong-pho-graffiti-ranh-gioi' AND t.`slug` = 'am-nhac';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'nghe-thuat-duong-pho-graffiti-ranh-gioi' AND t.`slug` = 'gen-z';

-- Bài 34: Lối sống tối giản Minimalism: Dọn dẹp đồ đạc để giải phóng không gian sống và tâm trí
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Lối sống tối giản Minimalism: Dọn dẹp đồ đạc để giải phóng không gian sống và tâm trí',
  'loi-song-toi-gian-minimalism-giai-phong-tam-tri',
  'Vứt bỏ những vật dụng không cần thiết sau một năm không dùng tới, tập trung vào những món đồ thực sự đem lại niềm vui và giá trị sử dụng lâu bền.',
  '<p class=\"lead font-medium\">Chủ nghĩa tiêu dùng quá đà khiến căn phòng của chúng ta chật chội và túi tiền cạn kiệt vì những món đồ mua theo cảm xúc nhất thời.</p>\n<p>Tối giản không phải là sống khổ hạnh, mà là lựa chọn sống có ý thức, dành thời gian và tiền bạc cho những trải nghiệm tinh thần sâu sắc hơn là sở hữu vật chất.</p>',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Minimalist Home',
  'Hoàng Yến',
  'STANDARD',
  3,
  0,
  0,
  1,
  10300,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 105 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'loi-song-toi-gian-minimalism-giai-phong-tam-tri' AND t.`slug` = 'song-xanh';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'loi-song-toi-gian-minimalism-giai-phong-tam-tri' AND t.`slug` = 'tam-ly';

-- Bài 35: Ẩm thực vỉa hè quanh làng đại học: Ký ức hương vị khó phai trong lòng bao thế hệ sinh viên
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Ẩm thực vỉa hè quanh làng đại học: Ký ức hương vị khó phai trong lòng bao thế hệ sinh viên',
  'am-thuc-via-he-lang-dai-hoc-ky-uc',
  'Đĩa cơm tấm sườn trứng giá rẻ, ly trà sữa trân châu full topping và nồi lẩu sinh viên nghi ngút khói là nơi chứng kiến biết bao câu chuyện vui buồn thời đi học.',
  '<p class=\"lead font-medium\">Dù sau này có đi ăn ở những nhà hàng sang trọng đến đâu, hương vị của những món ăn vỉa hè giản dị thời sinh viên vẫn luôn là miền ký ức ấm áp nhất.</p>\n<p>Bên cạnh yếu tố ngon - bổ - rẻ, vấn đề đảm bảo vệ sinh an toàn thực phẩm tại các quán ăn tự phát quanh cổng trường vẫn luôn cần sự giám sát chặt chẽ từ cơ quan y tế.</p>',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Street Food Vietnam',
  'Hải Đăng',
  'STANDARD',
  4,
  0,
  0,
  1,
  14600,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 130 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'am-thuc-via-he-lang-dai-hoc-ky-uc' AND t.`slug` = 'sinh-vien';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'am-thuc-via-he-lang-dai-hoc-ky-uc' AND t.`slug` = 'gen-z';

-- Bài 36: Phục hưng cổ phục Việt: Người trẻ tự hào khoác lên mình tà áo Tấc và Nhật Bình
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Phục hưng cổ phục Việt: Người trẻ tự hào khoác lên mình tà áo Tấc và Nhật Bình',
  'phuc-hung-co-phuc-viet-nguoi-tre-tu-hao',
  'Từ các buổi chụp ảnh kỷ yếu, lễ tốt nghiệp đến ngày hội văn hóa, hình ảnh các bạn trẻ diện trang phục truyền thống các triều đại đang lan tỏa tình yêu lịch sử nước nhà.',
  '<p class=\"lead font-medium\">Bằng việc nghiên cứu kỹ lưỡng các thư tịch cổ và hiện vật bảo tàng, các bạn trẻ đã tái hiện chuẩn xác từng đường may, hoa văn và màu sắc trang phục cổ truyền.</p>\n<p>Đây là minh chứng sống động cho thấy bản sắc văn hóa dân tộc luôn có sức sống trường tồn khi được tiếp nối bằng sự nhiệt huyết và niềm tự hào của thế hệ sau.</p>',
  'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Dự án Phục dựng Cổ phục',
  'Thanh Hằng',
  'STANDARD',
  4,
  0,
  0,
  1,
  16800,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 155 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'phuc-hung-co-phuc-viet-nguoi-tre-tu-hao' AND t.`slug` = 'gen-z';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'phuc-hung-co-phuc-viet-nguoi-tre-tu-hao' AND t.`slug` = 'giao-duc';

-- Bài 37: Podcast: Người bạn đồng hành tinh thần vỗ về tâm hồn người trẻ sau giờ tan tầm
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Podcast: Người bạn đồng hành tinh thần vỗ về tâm hồn người trẻ sau giờ tan tầm',
  'podcast-nguoi-ban-dong-hanh-tinh-than',
  'Cắm tai nghe giữa dòng xe kẹt cứng hay lắng nghe những câu chuyện trải lòng trước giờ đi ngủ, podcast đang dần thay thế thói quen xem video ngắn gây mỏi mắt.',
  '<p class=\"lead font-medium\">Nội dung phong phú từ phát triển bản thân, kỹ năng nghề nghiệp đến những chia sẻ về triết học cuộc sống đã biến podcast thành phương tiện học tập và giải trí lý tưởng.</p>\n<p>Sự chân thành trong giọng nói và chiều sâu thông tin tạo nên sợi dây kết nối đồng cảm mạnh mẽ giữa người làm nội dung và thính giả.</p>',
  'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Audio Studio',
  'Mai Phương',
  'STANDARD',
  3,
  0,
  0,
  1,
  9200,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 168 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'podcast-nguoi-ban-dong-hanh-tinh-than' AND t.`slug` = 'am-nhac';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'podcast-nguoi-ban-dong-hanh-tinh-than' AND t.`slug` = 'tam-ly';

-- Bài 38: Điện ảnh độc lập Việt Nam: Bước chuyển mình ấn tượng từ những nhà làm phim thế hệ mới
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Điện ảnh độc lập Việt Nam: Bước chuyển mình ấn tượng từ những nhà làm phim thế hệ mới',
  'dien-anh-doc-lap-viet-nam-chuyen-minh',
  'Những giải thưởng danh giá tại các liên hoan phim quốc tế uy tín đang khẳng định vị thế và góc nhìn nghệ thuật độc đáo của các đạo diễn trẻ nước nhà.',
  '<p class=\"lead font-medium\">Dám khai thác những đề tài gai góc của thân phận con người và hơi thở đương đại của xã hội, phim độc lập Việt Nam đang mang đến làn gió mới mẻ cho môn nghệ thuật thứ bảy.</p>\n<p>Dù đối mặt với bài toán kinh phí hạn hẹp, ngọn lửa đam mê và sự kiên định nghệ thuật đã giúp họ đưa câu chuyện Việt Nam bước ra thế giới.</p>',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Cinema Fest',
  'Quỳnh Trang',
  'STANDARD',
  5,
  0,
  0,
  1,
  11800,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 193 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dien-anh-doc-lap-viet-nam-chuyen-minh' AND t.`slug` = 'am-nhac';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dien-anh-doc-lap-viet-nam-chuyen-minh' AND t.`slug` = 'gen-z';

-- Bài 39: Xu hướng "bỏ phố về rừng" cắm trại cuối tuần: Tái tạo năng lượng giữa thiên nhiên hoang sơ
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Xu hướng \"bỏ phố về rừng\" cắm trại cuối tuần: Tái tạo năng lượng giữa thiên nhiên hoang sơ',
  'bo-pho-ve-rung-cam-trai-cuoi-tuan',
  'Rời xa màn hình vi tính và tiếng còi xe inh ỏi, những chuyến cắm trại ngủ lều bên bờ suối đang là liệu pháp xả stress được ưa chuộng hàng đầu.',
  '<p class=\"lead font-medium\">Nhóm lửa trại, tự tay nướng thịt và ngắm bầu trời sao đêm mang lại cảm giác bình yên mà không một trung tâm thương mại nào có thể đem lại.</p>\n<p>Nguyên tắc quan trọng nhất của trào lưu này là \"Leave No Trace\" - không để lại gì ngoài những dấu chân và không mang theo gì ngoài những bức ảnh đẹp.</p>',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Camp & Trail',
  'Hoàng Yến',
  'PHOTO_ESSAY',
  4,
  0,
  0,
  1,
  13200,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 218 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'bo-pho-ve-rung-cam-trai-cuoi-tuan' AND t.`slug` = 'song-xanh';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'bo-pho-ve-rung-cam-trai-cuoi-tuan' AND t.`slug` = 'gen-z';

-- Bài 40: Nhiếp ảnh phim cổ điển: Vì sao giới trẻ mê mẩn sự chờ đợi và chất màu hoài niệm?
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Nhiếp ảnh phim cổ điển: Vì sao giới trẻ mê mẩn sự chờ đợi và chất màu hoài niệm?',
  'nhiep-anh-phim-co-dien-vi-sao-me-man',
  'Trong thời đại chụp hàng trăm tấm ảnh kỹ thuật số chỉ bằng một nút bấm, chiếc máy ảnh phim cơ học đòi hỏi sự cẩn trọng, tính toán và niềm hạnh phúc khi tráng phim.',
  '<p class=\"lead font-medium\">Mỗi cuộn phim chỉ có 36 kiểu chụp buộc người bấm máy phải nâng niu từng khung hình, quan sát ánh sáng và chờ đợi khoảnh khắc hoàn hảo nhất.</p>\n<p>Chất hạt grain mộc mạc và màu sắc đặc trưng của từng loại phim mang lại chiều sâu cảm xúc mà các bộ lọc filter kỹ thuật số khó lòng sao chép trọn vẹn.</p>',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Film Community',
  'Thanh Hằng',
  'STANDARD',
  4,
  0,
  0,
  1,
  8700,
  'PUBLISHED',
  @default_author_id,
  4,
  DATE_SUB(NOW(), INTERVAL 243 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'nhiep-anh-phim-co-dien-vi-sao-me-man' AND t.`slug` = 'gen-z';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'nhiep-anh-phim-co-dien-vi-sao-me-man' AND t.`slug` = 'am-nhac';

-- Bài 41: Mô hình ngôn ngữ lớn tiếng Việt: Bước tiến mới trong tự chủ công nghệ trí tuệ nhân tạo
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Mô hình ngôn ngữ lớn tiếng Việt: Bước tiến mới trong tự chủ công nghệ trí tuệ nhân tạo',
  'mo-hinh-ngon-ngu-lon-tieng-viet-tu-chu-ai',
  'Các kỹ sư Việt Nam làm chủ hoàn toàn tập dữ liệu huấn luyện và kiến trúc mô hình, giúp giải quyết bài toán văn hóa, ngữ nghĩa tiếng Việt mà AI quốc tế còn hạn chế.',
  '<p class=\"lead font-medium\">Việc làm chủ công nghệ lõi AI không chỉ mang ý nghĩa kinh tế mà còn đảm bảo chủ quyền dữ liệu số và an ninh quốc gia trong kỷ nguyên thông tin.</p>\n<h3>Tối ưu hóa tài nguyên phần cứng cho doanh nghiệp nội địa</h3>\n<p>Mô hình được tối ưu để có thể triển khai trên các máy chủ có cấu hình vừa phải, giúp các doanh nghiệp vừa và nhỏ tại Việt Nam dễ dàng tích hợp vào quy trình chăm sóc khách hàng và tự động hóa vận hành.</p>\n<blockquote>\"Một mô hình hiểu sâu sắc văn hóa và tiếng nói người Việt sẽ tạo ra những giá trị ứng dụng thực tiễn vượt trội so với các mô hình dịch máy từ tiếng nước ngoài.\"</blockquote>\n<p>Nhiều viện nghiên cứu và trường đại học lớn đã bắt đầu đưa mô hình vào phục vụ nghiên cứu khoa học và đào tạo nhân lực bán dẫn, trí tuệ nhân tạo chất lượng cao.</p>',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: AI Research Vietnam',
  'Lê Thanh - TechHub',
  'LONGFORM',
  6,
  1,
  1,
  1,
  34850,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 28 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mo-hinh-ngon-ngu-lon-tieng-viet-tu-chu-ai' AND t.`slug` = 'ai';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mo-hinh-ngon-ngu-lon-tieng-viet-tu-chu-ai' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'mo-hinh-ngon-ngu-lon-tieng-viet-tu-chu-ai' AND t.`slug` = 'khoi-nghiep';

-- Bài 42: Startup xe máy điện thông minh của kỹ sư trẻ Việt Nam gọi vốn thành công 10 triệu USD
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Startup xe máy điện thông minh của kỹ sư trẻ Việt Nam gọi vốn thành công 10 triệu USD',
  'startup-xe-may-dien-thong-minh-goi-von-10-trieu-usd',
  'Vòng gọi vốn Series A do các quỹ đầu tư mạo hiểm quốc tế dẫn dắt mở đường cho kế hoạch mở rộng nhà máy sản xuất và trạm đổi pin nhanh tự động toàn quốc.',
  '<p class=\"lead font-medium\">Được sáng lập bởi nhóm cựu sinh viên Bách Khoa, mẫu xe điện thông minh sở hữu khả năng di chuyển hơn 150km sau một lần sạc và tích hợp GPS định vị chống trộm thông minh.</p>\n<p>Mục tiêu của dự án là thúc đẩy giao thông xanh đô thị, giảm thiểu khí thải CO2 và chứng minh năng lực thiết kế phần cứng của kỹ sư công nghệ Việt Nam.</p>',
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: CleanTech EV',
  'Lê Bảo',
  'STANDARD',
  4,
  0,
  1,
  1,
  26700,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 53 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'startup-xe-may-dien-thong-minh-goi-von-10-trieu-usd' AND t.`slug` = 'khoi-nghiep';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'startup-xe-may-dien-thong-minh-goi-von-10-trieu-usd' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'startup-xe-may-dien-thong-minh-goi-von-10-trieu-usd' AND t.`slug` = 'song-xanh';

-- Bài 43: Ứng dụng Blockchain vào truy xuất nguồn gốc nông sản: Minh bạch hóa từ nông trại tới bàn ăn
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Ứng dụng Blockchain vào truy xuất nguồn gốc nông sản: Minh bạch hóa từ nông trại tới bàn ăn',
  'ung-dung-blockchain-truy-xuat-nguon-goc-nong-san',
  'Mỗi quả xoài, buồng chuối xuất khẩu đều gắn mã QR định danh trên sổ cái phi tập trung, giúp người tiêu dùng châu Âu kiểm chứng nhật ký canh tác sạch theo thời gian thực.',
  '<p class=\"lead font-medium\">Công nghệ chuỗi khối giúp xóa bỏ tình trạng gian lận nhãn mác hữu cơ, nâng cao giá trị thặng dư cho bà con nông dân và mở rộng đường xuất khẩu cho nông sản Việt.</p>\n<p>Hệ thống ghi nhận bất biến mọi thông số từ nhiệt độ kho lạnh, lịch bón phân sinh học đến hành trình vận chuyển container trên biển.</p>',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: AgriTech Hub',
  'Đình Trọng',
  'STANDARD',
  4,
  0,
  0,
  1,
  12100,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 78 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'ung-dung-blockchain-truy-xuat-nguon-goc-nong-san' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'ung-dung-blockchain-truy-xuat-nguon-goc-nong-san' AND t.`slug` = 'khoi-nghiep';

-- Bài 44: Cuộc đua sản xuất chip bán dẫn toàn cầu: Cơ hội vàng cho kỹ sư vi mạch trẻ tại Việt Nam
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Cuộc đua sản xuất chip bán dẫn toàn cầu: Cơ hội vàng cho kỹ sư vi mạch trẻ tại Việt Nam',
  'cuoc-dua-chip-ban-dan-toan-cau-co-hoi-ky-su-tre',
  'Hàng loạt tập đoàn vi mạch hàng đầu thế giới mở trung tâm R&D tại Việt Nam mở ra hàng ngàn cơ hội việc làm thu nhập cao cho sinh viên ngành Điện tử - Viễn thông.',
  '<p class=\"lead font-medium\">Chiến lược quốc gia về phát triển công nghiệp bán dẫn đặt mục tiêu đào tạo 50.000 kỹ sư vi mạch đến năm 2030, tạo động lực bứt phá chưa từng có.</p>\n<p>Các trường đại học đang khẩn trương đầu tư phòng lab đo kiểm vi mạch hiện đại và hợp tác cùng các đối tác công nghệ để chuyển giao bản quyền phần mềm thiết kế tiên tiến.</p>',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Semiconductor World',
  'Lê Thanh - TechHub',
  'STANDARD',
  5,
  0,
  0,
  1,
  18900,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 103 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'cuoc-dua-chip-ban-dan-toan-cau-co-hoi-ky-su-tre' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'cuoc-dua-chip-ban-dan-toan-cau-co-hoi-ky-su-tre' AND t.`slug` = 'giao-duc';

-- Bài 45: Điện mặt trời mái nhà và lưu trữ năng lượng: Giải pháp xanh cho khuôn viên trường đại học
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Điện mặt trời mái nhà và lưu trữ năng lượng: Giải pháp xanh cho khuôn viên trường đại học',
  'dien-mat-troi-mai-nha-luu-tru-nang-luong',
  'Tận dụng hàng ngàn mét vuông mái các tòa nhà giảng đường để lắp đặt pin mặt trời công suất 2MWp, cung cấp 40\% nhu cầu điện sinh hoạt và nghiên cứu của trường.',
  '<p class=\"lead font-medium\">Dự án không chỉ tiết kiệm hàng trăm triệu đồng tiền điện mỗi tháng mà còn là mô hình thực nghiệm trực quan cho sinh viên ngành Kỹ thuật năng lượng tái tạo.</p>\n<p>Hệ thống pin lưu trữ lithium thông minh cho phép tự động điều phối điện lưới trong các giờ cao điểm, giảm tải cho hệ thống điện quốc gia.</p>',
  'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Solar Power Tech',
  'Tuấn Cường',
  'STANDARD',
  4,
  0,
  0,
  1,
  7900,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 128 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dien-mat-troi-mai-nha-luu-tru-nang-luong' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'dien-mat-troi-mai-nha-luu-tru-nang-luong' AND t.`slug` = 'song-xanh';

-- Bài 46: Kỷ nguyên điện toán lượng tử: Khi các bài toán phức tạp hàng ngàn năm được giải trong vài giây
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Kỷ nguyên điện toán lượng tử: Khi các bài toán phức tạp hàng ngàn năm được giải trong vài giây',
  'ky-nguyen-dien-toan-luong-tu-ky-nguyen-moi',
  'Sự phát triển của bộ xử lý lượng tử (QPU) hứa hẹn tạo nên bước nhảy vọt trong nghiên cứu vật liệu mới, giải mã cấu trúc protein và tối ưu hóa hệ thống tài chính toàn cầu.',
  '<p class=\"lead font-medium\">Điện toán lượng tử dựa trên nguyên lý chồng chập và vướng víu lượng tử của qubit, mở ra khả năng tính toán vượt xa mọi siêu máy tính truyền thống mạnh nhất hiện nay.</p>\n<p>Tuy nhiên, thách thức về bảo mật và nhu cầu cấp thiết về mã hóa hậu lượng tử (Post-Quantum Cryptography) cũng đang đặt ra bài toán hóc búa cho các chuyên gia an ninh mạng.</p>',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Quantum Lab',
  'Lê Thanh - TechHub',
  'STANDARD',
  5,
  0,
  0,
  1,
  13500,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 153 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'ky-nguyen-dien-toan-luong-tu-ky-nguyen-moi' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'ky-nguyen-dien-toan-luong-tu-ky-nguyen-moi' AND t.`slug` = 'khoa-hoc';

-- Bài 47: Startup EdTech Việt vươn tầm Đông Nam Á với nền tảng học tập cá nhân hóa ứng dụng AI
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Startup EdTech Việt vươn tầm Đông Nam Á với nền tảng học tập cá nhân hóa ứng dụng AI',
  'startup-edtech-viet-hoc-tap-ca-nhan-hoa-ai',
  'Thuật toán theo dõi tiến độ và điểm yếu của từng học sinh để tự động điều chỉnh lộ trình học tập tối ưu, giúp tăng 40\% hiệu quả tiếp thu kiến thức.',
  '<p class=\"lead font-medium\">Khác với mô hình học thụ động qua video quay sẵn, nền tảng mang đến trải nghiệm tương tác hai chiều thông minh như có gia sư kèm cặp 1:1.</p>\n<p>Dự án hiện đã có mặt tại Indonesia, Thái Lan và Việt Nam với hơn 500.000 người dùng hoạt động thường xuyên mỗi tháng.</p>',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: EdTech Platform',
  'Lê Bảo',
  'STANDARD',
  4,
  0,
  0,
  1,
  11600,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 178 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'startup-edtech-viet-hoc-tap-ca-nhan-hoa-ai' AND t.`slug` = 'khoi-nghiep';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'startup-edtech-viet-hoc-tap-ca-nhan-hoa-ai' AND t.`slug` = 'ai';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'startup-edtech-viet-hoc-tap-ca-nhan-hoa-ai' AND t.`slug` = 'giao-duc';

-- Bài 48: Trợ lý lập trình AI thế hệ mới: Hỗ trợ viết mã, tự động kiểm thử và tái cấu trúc phần mềm
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Trợ lý lập trình AI thế hệ mới: Hỗ trợ viết mã, tự động kiểm thử và tái cấu trúc phần mềm',
  'tro-ly-lap-trinh-ai-the-he-moi',
  'Không còn là công cụ gợi ý dòng lệnh đơn giản, AI giờ đây có thể hiểu ngữ cảnh kiến trúc hệ thống, phát hiện lỗ hổng bảo mật và đề xuất bản vá hoàn chỉnh.',
  '<p class=\"lead font-medium\">Sự trợ giúp đắc lực của các trợ lý AI giúp các lập trình viên giải phóng thời gian khỏi các tác vụ lặp đi lặp lại để tập trung vào tư duy thiết kế giải thuật và trải nghiệm người dùng.</p>\n<p>Kỹ năng làm chủ các công cụ hỗ trợ AI (AI-assisted engineering) đang trở thành yêu cầu bắt buộc trong bảng mô tả công việc của các công ty phần mềm hiện đại.</p>',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Code & Design',
  'Lê Thanh - TechHub',
  'STANDARD',
  4,
  0,
  0,
  1,
  15300,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 203 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tro-ly-lap-trinh-ai-the-he-moi' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'tro-ly-lap-trinh-ai-the-he-moi' AND t.`slug` = 'ai';

-- Bài 49: Bảo vệ danh tính số trước làn sóng Deepfake lừa đảo: Khi "mắt thấy tai nghe" chưa chắc đã là sự thật
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Bảo vệ danh tính số trước làn sóng Deepfake lừa đảo: Khi \"mắt thấy tai nghe\" chưa chắc đã là sự thật',
  'bao-ve-danh-tinh-so-truoc-deepfake',
  'Các cuộc gọi video giả mạo khuôn mặt và giọng nói của người thân để vay tiền khẩn cấp đang gây thiệt hại hàng trăm tỷ đồng, đòi hỏi giải pháp xác thực đa lớp cấp thiết.',
  '<p class=\"lead font-medium\">Công nghệ tổng hợp hình ảnh và giọng nói đã đạt đến độ chân thực khiến mắt thường rất khó phát hiện các điểm sai lệch.</p>\n<p>Các chuyên gia khuyến cáo khi nhận được các cuộc gọi video yêu cầu chuyển tiền gấp, người dân cần chủ động gọi lại qua số điện thoại truyền thống hoặc đặt ra những câu hỏi kiểm chứng bí mật mà chỉ người thân mới biết.</p>',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Cyber Safety',
  'Tuấn Cường',
  'STANDARD',
  5,
  0,
  0,
  1,
  20100,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 216 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'bao-ve-danh-tinh-so-truoc-deepfake' AND t.`slug` = 'an-ninh-mang';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'bao-ve-danh-tinh-so-truoc-deepfake' AND t.`slug` = 'ai';

-- Bài 50: Thành phố thông minh (Smart City): Cách IoT và dữ liệu lớn tối ưu hóa mạng lưới giao thông đô thị
INSERT INTO `posts` (
  `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, 
  `byline`, `post_format`, `reading_time`, `is_spotlight`, `is_trending`, 
  `allow_comments`, `views_count`, `status`, `author_id`, `category_id`, `published_at`
) VALUES (
  'Thành phố thông minh (Smart City): Cách IoT và dữ liệu lớn tối ưu hóa mạng lưới giao thông đô thị',
  'thanh-pho-thong-minh-iot-du-lieu-lon-giao-thong',
  'Hệ thống đèn tín hiệu giao thông thích ứng tự động điều chỉnh chu kỳ đèn theo mật độ xe cộ thời gian thực, giảm 25\% thời gian ùn tắc tại các nút giao trọng điểm.',
  '<p class=\"lead font-medium\">Hàng ngàn cảm biến và camera AI lắp đặt dọc các trục đường chính liên tục truyền dữ liệu về trung tâm điều hành đô thị thông minh (IOC).</p>\n<p>Đây là minh chứng rõ nét cho thấy sức mạnh của dữ liệu số trong việc nâng cao chất lượng cuộc sống cư dân và xây dựng môi trường sống văn minh, bền vững.</p>',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&auto=format&fit=crop&q=80',
  'Ảnh: Urban Smart Tech',
  'Lê Thanh - TechHub',
  'STANDARD',
  4,
  0,
  0,
  1,
  14200,
  'PUBLISHED',
  @default_author_id,
  5,
  DATE_SUB(NOW(), INTERVAL 241 HOUR)
) ON DUPLICATE KEY UPDATE 
  `views_count` = VALUES(`views_count`),
  `is_spotlight` = VALUES(`is_spotlight`),
  `is_trending` = VALUES(`is_trending`),
  `published_at` = VALUES(`published_at`);
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'thanh-pho-thong-minh-iot-du-lieu-lon-giao-thong' AND t.`slug` = 'cong-nghe';
INSERT IGNORE INTO `post_tags` (`post_id`, `tag_id`) 
SELECT p.`id`, t.`id` FROM `posts` p, `tags` t WHERE p.`slug` = 'thanh-pho-thong-minh-iot-du-lieu-lon-giao-thong' AND t.`slug` = 'khoa-hoc';

-- 5. Tạo dữ liệu mẫu cho Lịch sử đọc và Bookmark để kiểm thử đề xuất cá nhân hóa
SET @test_user_id = (SELECT `id` FROM `users` ORDER BY `id` ASC LIMIT 1);

-- Bookmark 3 bài viết tiêu biểu
INSERT IGNORE INTO `bookmarks` (`user_id`, `post_id`, `created_at`)
SELECT @test_user_id, `id`, NOW() FROM `posts` WHERE `slug` IN (
  'tuyen-sinh-dai-hoc-2026-doi-moi-xet-tuyen',
  'mo-hinh-ngon-ngu-lon-tieng-viet-tu-chu-ai',
  'trao-luu-song-xanh-zero-waste-nguoi-tre'
);

-- Lịch sử đọc gần đây
INSERT INTO `reading_history` (`user_id`, `post_id`, `read_at`)
SELECT @test_user_id, `id`, DATE_SUB(NOW(), INTERVAL 2 HOUR) FROM `posts` WHERE `slug` = 'mo-hinh-ngon-ngu-lon-tieng-viet-tu-chu-ai'
UNION ALL
SELECT @test_user_id, `id`, DATE_SUB(NOW(), INTERVAL 5 HOUR) FROM `posts` WHERE `slug` = 'tri-tue-nhan-tao-va-tuong-lai-viec-lam'
UNION ALL
SELECT @test_user_id, `id`, DATE_SUB(NOW(), INTERVAL 1 DAY) FROM `posts` WHERE `slug` = 'phong-su-goc-khuat-lam-them-sinh-vien';

-- Sở thích chủ đề của user (quan tâm Công nghệ & Thời sự)
INSERT IGNORE INTO `user_topic_preferences` (`user_id`, `category_id`)
VALUES 
(@test_user_id, 1),
(@test_user_id, 5);

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- HOÀN TẤT: Đã chèn thành công 50 bài viết tin tức, 15 thẻ tags,
-- liên kết chuyên mục, bookmark và lịch sử đọc cá nhân hóa.
-- ====================================================================
