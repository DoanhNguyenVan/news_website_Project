-- ====================================================================
-- NEWS PORTAL DATABASE (newsDB) - PHIÊN BẢN CHUẨN MYSQL 8.0
-- TỐI ƯU TÒA SOẠN BÁO CHÍ SINH VIÊN (DEPOLY ĐƯỢC CẢ LOCALHOST & RENDER/AIVEN)
-- ====================================================================

-- Xóa database cũ nếu có và tạo mới tinh
DROP DATABASE IF EXISTS `newsDB`;
CREATE DATABASE `newsDB` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `newsDB`;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `reading_history`;
DROP TABLE IF EXISTS `bookmarks`;
DROP TABLE IF EXISTS `user_topic_preferences`;
DROP TABLE IF EXISTS `poll_options`;
DROP TABLE IF EXISTS `polls`;
DROP TABLE IF EXISTS `advertisements`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `media`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `post_tags`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `post_revisions`;
DROP TABLE IF EXISTS `verification_tokens`;
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- 1. BẢNG NGƯỜI DÙNG & TÒA SOẠN (USERS)
-- ====================================================================
CREATE TABLE `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) DEFAULT NULL COMMENT 'NULL nếu đăng nhập bằng Google OAuth',
  `full_name` VARCHAR(100) DEFAULT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `auth_provider` VARCHAR(20) NOT NULL DEFAULT 'LOCAL' COMMENT 'LOCAL (mật khẩu) hoặc GOOGLE',
  `google_account_id` VARCHAR(100) DEFAULT NULL,
  `facebook_account_id` VARCHAR(100) DEFAULT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT 'SUPER_ADMIN, EDITOR_IN_CHIEF, EDITOR, AUTHOR, USER',
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_secret` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, BANNED',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: Dang hoat dong, 1: Xoa mem',
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 2. BẢNG CHUYÊN MỤC BÁO CHÍ (CATEGORIES)
-- ====================================================================
CREATE TABLE `categories` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `parent_id` BIGINT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: Dang hoat dong, 1: Xoa mem',
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_categories_slug` (`slug`),
  INDEX `idx_categories_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 3. BẢNG BÀI VIẾT BÁO CHÍ (POSTS)
-- ====================================================================
CREATE TABLE `posts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(280) NOT NULL UNIQUE,
  `sapo` TEXT NOT NULL COMMENT 'Đoạn mở đầu / Lead tóm tắt báo chí',
  `content` LONGTEXT NOT NULL COMMENT 'Nội dung Rich-text / Longform HTML',
  `thumbnail_url` VARCHAR(500) DEFAULT NULL COMMENT 'Link ảnh Cloudinary WebP',
  `thumbnail_credit` VARCHAR(150) DEFAULT NULL COMMENT 'Nguồn ảnh / Bản quyền ảnh báo chí',
  `byline` VARCHAR(100) DEFAULT NULL COMMENT 'Bút danh phóng viên (VD: Hải Đăng - K21)',
  `post_format` VARCHAR(30) NOT NULL DEFAULT 'STANDARD' COMMENT 'STANDARD, LONGFORM, PHOTO_ESSAY',
  `reading_time` INT NOT NULL DEFAULT 3 COMMENT 'Thời gian đọc ước tính (phút)',
  `series_name` VARCHAR(150) DEFAULT NULL COMMENT 'Tên tuyến phóng sự / chuyên đề dài kỳ (Giữ chân độc giả)',
  `series_order` INT DEFAULT NULL COMMENT 'Thứ tự kỳ trong tuyến bài (Kỳ 1, Kỳ 2...)',
  `audio_url` VARCHAR(255) DEFAULT NULL COMMENT 'File Audio Podcast đọc bài viết',
  `video_url` VARCHAR(255) DEFAULT NULL COMMENT 'Link nhúng Video YouTube',
  `is_spotlight` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Ghim tiêu điểm trang chủ',
  `is_trending` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Ghim tin xu hướng',
  `allow_comments` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Bật/tắt bình luận bài viết',
  `views_count` BIGINT NOT NULL DEFAULT 0,
  `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, PENDING_APPROVAL, APPROVED, PUBLISHED, REJECTED',
  `rejection_reason` VARCHAR(500) DEFAULT NULL COMMENT 'Góp ý của Ban biên tập khi từ chối bài',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Cờ xóa mềm (0: Bình thường, 1: Đã xóa vào thùng rác)',
  `deleted_at` DATETIME DEFAULT NULL COMMENT 'Thời gian xóa mềm',
  `deleted_by` VARCHAR(100) DEFAULT NULL COMMENT 'Username của người thực hiện xóa bài',
  `author_id` BIGINT NOT NULL,
  `category_id` BIGINT NOT NULL,
  `published_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_posts_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  INDEX `idx_posts_status_published` (`status`, `published_at`),
  INDEX `idx_posts_trending` (`status`, `views_count`),
  INDEX `idx_posts_category` (`category_id`, `status`),
  INDEX `idx_posts_series` (`series_name`),
  INDEX `idx_posts_deleted` (`is_deleted`),
  FULLTEXT INDEX `ft_posts_search` (`title`, `sapo`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 4. BẢNG BÌNH LUẬN ĐA CẤP (COMMENTS)
-- ====================================================================
CREATE TABLE `comments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `content` TEXT NOT NULL,
  `parent_id` BIGINT DEFAULT NULL COMMENT 'Trả lời bình luận nào (Threaded reply)',
  `status` VARCHAR(20) NOT NULL DEFAULT 'APPROVED' COMMENT 'APPROVED, HIDDEN',
  `likes_count` INT NOT NULL DEFAULT 0,
  `dislikes_count` INT NOT NULL DEFAULT 0,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: Dang hoat dong, 1: Xoa mem',
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  INDEX `idx_comments_post_status` (`post_id`, `status`),
  INDEX `idx_comments_parent` (`parent_id`),
  INDEX `idx_comments_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 5. BẢNG THƯ VIỆN MEDIA & ẢNH (MEDIA)
-- ====================================================================
CREATE TABLE `media` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `file_url` VARCHAR(500) NOT NULL COMMENT 'URL Cloudinary / uploads',
  `file_type` VARCHAR(50) DEFAULT NULL,
  `file_size` BIGINT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 6. BẢNG QUẢNG CÁO & BANNER (ADVERTISEMENTS)
-- ====================================================================
CREATE TABLE `advertisements` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `target_url` VARCHAR(500) DEFAULT NULL,
  `position` VARCHAR(50) NOT NULL DEFAULT 'HOME_TOP' COMMENT 'HOME_TOP, HOME_SIDEBAR, ARTICLE_SIDEBAR, FOOTER',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Admin có thể bật/tắt (1: Hiển thị, 0: Ẩn)',
  `click_count` BIGINT NOT NULL DEFAULT 0,
  `start_date` DATETIME DEFAULT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_advertisements_position` (`position`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 7. BẢNG THĂM DÒ Ý KIẾN / BÌNH CHỌN (POLLS & POLL_OPTIONS)
-- TÍNH NĂNG "GIỮ CHÂN ĐỘC GIẢ" CHUẨN BÁO CHÍ
-- ====================================================================
CREATE TABLE `polls` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `post_id` BIGINT DEFAULT NULL COMMENT 'Gắn kèm bài viết cụ thể (hoặc NULL nếu là poll toàn trang)',
  `question` VARCHAR(300) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_polls_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `poll_options` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `poll_id` BIGINT NOT NULL,
  `option_text` VARCHAR(200) NOT NULL,
  `votes_count` INT NOT NULL DEFAULT 0,
  CONSTRAINT `fk_options_poll` FOREIGN KEY (`poll_id`) REFERENCES `polls` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 6.5. HỆ THỐNG TAGS & PHÂN LOẠI NỘI DUNG (TAGS & POST_TAGS)
-- ====================================================================
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

-- ====================================================================
-- 7. CÁ NHÂN HÓA ĐỌC BÁO & LƯU BÀI VIẾT (PERSONALIZATION & BOOKMARKS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `reading_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `post_id` BIGINT NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  INDEX `idx_history_user_read` (`user_id`, `read_at`),
  INDEX `idx_history_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `post_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_bookmark_user_post` (`user_id`, `post_id`),
  CONSTRAINT `fk_bookmark_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookmark_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  INDEX `idx_bookmark_user` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_topic_preferences` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `category_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_category_pref` (`user_id`, `category_id`),
  CONSTRAINT `fk_pref_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pref_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_pref` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 8. DỮ LIỆU MẪU KHỞI TẠO (SEED DATA)
-- Mật khẩu mặc định của các tài khoản tòa soạn: admin123
-- ====================================================================

-- 1. Tài khoản nhân sự tòa soạn
INSERT INTO `users` (`username`, `email`, `password_hash`, `full_name`, `auth_provider`, `role`, `status`, `is_email_verified`, `two_factor_enabled`, `is_deleted`) VALUES
('admin', 'admin@newsportal.com', '$2a$10$b5UEcM1/CQbmfy2APpY6DO3p0pz5/tmaPJyIXhRp08BwkJKRzzJK.', 'Quản Trị Kỹ Thuật', 'LOCAL', 'SUPER_ADMIN', 'ACTIVE', 1, 0, 0),
('editor_chief', 'chief@newsportal.com', '$2a$10$b5UEcM1/CQbmfy2APpY6DO3p0pz5/tmaPJyIXhRp08BwkJKRzzJK.', 'Tổng Biên Tập (Giảng viên/Trưởng nhóm)', 'LOCAL', 'EDITOR_IN_CHIEF', 'ACTIVE', 1, 0, 0),
('editor1', 'editor1@newsportal.com', '$2a$10$b5UEcM1/CQbmfy2APpY6DO3p0pz5/tmaPJyIXhRp08BwkJKRzzJK.', 'Trưởng Ban Biên Tập', 'LOCAL', 'EDITOR', 'ACTIVE', 1, 0, 0),
('author1', 'author1@newsportal.com', '$2a$10$b5UEcM1/CQbmfy2APpY6DO3p0pz5/tmaPJyIXhRp08BwkJKRzzJK.', 'Phóng viên Nguyễn Văn A', 'LOCAL', 'AUTHOR', 'ACTIVE', 1, 0, 0);

-- 2. Hệ thống chuyên mục báo chí sinh viên
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `is_deleted`) VALUES
(1, 'Thời sự Giảng đường', 'thoi-su-giang-duong', 'Tin tức sự kiện đời sống sinh viên và trường học', 0),
(2, 'Phóng sự & Điều tra', 'phong-su-dieu-tra', 'Các tuyến bài điều tra, ghi chép chuyên sâu', 0),
(3, 'Góc nhìn & Bình luận', 'goc-nhin-binh-luan', 'Ý kiến đa chiều, góc nhìn của giới trẻ về các vấn đề xã hội', 0),
(4, 'Văn hóa & Đời sống', 'van-hoa-doi-song', 'Nghệ thuật, điện ảnh, sách và phong cách sống sinh viên', 0),
(5, 'Công nghệ & Khởi nghiệp', 'cong-nghe-khoi-nghiep', 'Xu hướng AI, công nghệ mới và dự án khởi nghiệp trẻ', 0);

-- 3. Bài viết mẫu đa dạng chuyên mục & định dạng báo chí
INSERT INTO `posts` (`id`, `title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, `byline`, `post_format`, `reading_time`, `series_name`, `series_order`, `is_spotlight`, `is_trending`, `status`, `author_id`, `category_id`, `is_deleted`, `published_at`) VALUES
(1, 'Chuyện nghề làm báo thời trí tuệ nhân tạo: Khi ngòi bút đối thoại cùng thuật toán', 
 'chuyen-nghe-lam-bao-thoi-tri-tue-nhan-tao', 
 'Giữa làn sóng bùng nổ của các mô hình ngôn ngữ lớn, những người làm báo trẻ tại giảng đường đang đứng trước bước ngoặt: Tận dụng công nghệ để khai phóng sức sáng tạo hay để AI lấn át bản sắc báo chí?', 
 '<p class="lead font-medium">Báo chí không đơn thuần là truyền tải sự thật, mà là truyền tải sự thật qua lăng kính trắc ẩn của con người. Đó là thứ mà không dòng mã lệnh nào có thể thay thế được.</p><p>Tại các tòa soạn hiện đại, sự xuất hiện của các công cụ hỗ trợ thông minh đã rút ngắn thời gian xử lý dữ liệu từ hàng giờ xuống vài giây. Tuy nhiên, linh hồn của một tác phẩm báo chí vẫn nằm ở những bước chân đi thực địa, những cuộc phỏng vấn đối mặt và cảm xúc chân thật từ hiện trường.</p><p>Sinh viên báo chí thời đại 4.0 cần trang bị cả tư duy phản biện lẫn kỹ năng làm chủ công nghệ, biến AI thành trợ lý đắc lực thay vì phụ thuộc thụ động.</p>', 
 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200', 
 'Ảnh: Getty Images / Báo chí Số', 
 'Hải Đăng (Khoa Báo chí)', 
 'LONGFORM', 
 5, 
 'Báo chí và Công nghệ Tương lai',
 1,
 1, 
 1,
 'PUBLISHED', 
 4, 
 2, 
 0,
 NOW()),

(2, 'Sinh viên năm nhất và áp lực hòa nhập: Đừng để giảng đường trở thành nỗi cô đơn', 
 'sinh-vien-nam-nhat-va-ap-luc-hoa-nhap', 
 'Rời vòng tay gia đình bước vào cánh cổng đại học, nhiều tân sinh viên đối diện với cú sốc văn hóa, nỗi nhớ nhà và áp lực đồng trang lứa. Làm thế nào để tìm thấy chỗ đứng của mình?', 
 '<p>Bước vào giảng đường đại học là một bước ngoặt lớn, mở ra chân trời tự do nhưng cũng đi kèm muôn vàn bỡ ngỡ. Không ít bạn trẻ cảm thấy lạc lõng giữa hội trường hàng trăm người, tự ti trước những bạn bè tài năng.</p><p>Theo các chuyên gia tâm lý học đường, chìa khóa để vượt qua giai đoạn này chính là chủ động kết nối: tham gia câu lạc bộ, mở lòng chia sẻ và chấp nhận rằng mọi sự khởi đầu đều cần thời gian thích nghi.</p>', 
 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200', 
 'Ảnh: Ban Truyền thông SV', 
 'Minh Thảo', 
 'STANDARD', 
 3, 
 NULL,
 NULL,
 0, 
 1,
 'PUBLISHED', 
 4, 
 1, 
 0,
 NOW()),

(3, 'Thế hệ Gen Z và trào lưu sống xanh: Từ ý thức đến hành động thực tiễn', 
 'the-he-gen-z-va-trao-luu-song-xanh', 
 'Không chỉ dừng lại ở khẩu hiệu, sinh viên ngày nay đang biến lối sống bền vững thành thói quen thường nhật với những dự án tái chế và tiêu dùng có trách nhiệm.', 
 '<p>Tại khuôn viên các trường đại học, hình ảnh những chiếc bình nước cá nhân, túi vải canvas hay các gian hàng đổi rác lấy cây xanh đã trở nên quen thuộc.</p><p>Gen Z không chỉ nói về biến đổi khí hậu trên mạng xã hội, họ trực tiếp hành động bằng việc ủng hộ thời trang tuần hoàn, giảm thiểu đồ nhựa dùng một lần và lan tỏa tinh thần sống có trách nhiệm với mẹ thiên nhiên.</p>', 
 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200', 
 'Ảnh: Unsplash', 
 'Khánh Linh', 
 'STANDARD', 
 4, 
 NULL,
 NULL,
 0, 
 0,
 'PUBLISHED', 
 4, 
 4, 
 0,
 NOW()),

(4, 'Startup sinh viên và bài toán gọi vốn: Đam mê thôi chưa đủ, cần chiến lược bài bản', 
 'startup-sinh-vien-va-bai-toan-goi-von', 
 'Nhiều dự án khởi nghiệp trẻ tại các cuộc thi vườn ươm sáng tạo thu hút sự chú ý của các quỹ đầu tư mạo hiểm nhờ ý tưởng độc đáo ứng dụng trí tuệ nhân tạo.', 
 '<p>Khởi nghiệp từ thời sinh viên luôn là hành trình đầy thách thức nhưng giàu tiềm năng. Điểm khác biệt của các founder trẻ hiện nay là sự nhạy bén với công nghệ mới và tư duy giải quyết vấn đề xã hội.</p><p>Tuy nhiên, các nhà đầu tư nhận định đam mê chỉ là điểm khởi đầu. Một kế hoạch tài chính minh bạch, khả năng triển khai thực tế và đội ngũ gắn kết mới là yếu tố quyết định sự sống còn của một startup.</p>', 
 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200', 
 'Ảnh: Tech Hub', 
 'Đức Huy', 
 'STANDARD', 
 4, 
 NULL,
 NULL,
 0, 
 0,
 'PUBLISHED', 
 4, 
 5, 
 0,
 NOW());

-- 4. Khảo sát nhanh đi kèm bài viết (Interactive Quick Poll)
INSERT INTO `polls` (`id`, `post_id`, `question`, `is_active`) VALUES
(1, 1, 'Theo bạn, sinh viên báo chí có nên sử dụng AI khi viết bài phóng sự thực tế?', 1);

INSERT INTO `poll_options` (`poll_id`, `option_text`, `votes_count`) VALUES
(1, 'Nên dùng như công cụ hỗ trợ tra cứu và gợi ý', 42),
(1, 'Không nên dùng, phóng viên phải tự viết 100%', 18),
(1, 'Cần có quy định liêm chính rõ ràng từ khoa/nhà trường', 35);

-- 5. Banner quảng cáo văn minh (Native Ads)
INSERT INTO `advertisements` (`title`, `image_url`, `target_url`, `position`, `is_active`) VALUES
('Chào mừng tân sinh viên K22 - Khoa Báo chí & Truyền thông', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200', 'https://tuyensinh.edu.vn', 'HOME_TOP', 1),
('Tuyển dụng Cộng tác viên Tạp chí Sinh viên Mùa Thu 2026', 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600', 'https://newsportal.com/recruitment', 'HOME_SIDEBAR', 1);
