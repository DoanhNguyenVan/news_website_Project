-- ====================================================================
-- NEWS PORTAL DATABASE (newsDB) - PHIÊN BẢN CHUẨN MYSQL 8.0
-- TỐI ƯU TÒA SOẠN BÁO CHÍ SINH VIÊN (DEPOLY ĐƯỢC CẢ LOCALHOST & RENDER/AIVEN)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `newsDB` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `newsDB`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `poll_options`;
DROP TABLE IF EXISTS `polls`;
DROP TABLE IF EXISTS `advertisements`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `media`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- Dọn các bảng rác cũ nếu tồn tại
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
  `role` VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT 'SUPER_ADMIN, EDITOR_IN_CHIEF, EDITOR, AUTHOR, USER',
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, BANNED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_email` (`email`)
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_categories_slug` (`slug`)
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
  `author_id` BIGINT NOT NULL,
  `category_id` BIGINT NOT NULL,
  `published_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_posts_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  INDEX `idx_posts_status_published` (`status`, `published_at`),
  INDEX `idx_posts_trending` (`status`, `views_count`),
  INDEX `idx_posts_category` (`category_id`, `status`),
  INDEX `idx_posts_series` (`series_name`),
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  INDEX `idx_comments_post_status` (`post_id`, `status`),
  INDEX `idx_comments_parent` (`parent_id`)
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
INSERT INTO `users` (`username`, `email`, `password_hash`, `full_name`, `auth_provider`, `role`, `status`) VALUES
('admin', 'admin@newsportal.com', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Quản Trị Kỹ Thuật', 'LOCAL', 'SUPER_ADMIN', 'ACTIVE'),
('editor_chief', 'chief@newsportal.com', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Tổng Biên Tập (Giảng viên/Trưởng nhóm)', 'LOCAL', 'EDITOR_IN_CHIEF', 'ACTIVE'),
('editor1', 'editor1@newsportal.com', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trưởng Ban Biên Tập', 'LOCAL', 'EDITOR', 'ACTIVE'),
('author1', 'author1@newsportal.com', '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Phóng viên Nguyễn Văn A', 'LOCAL', 'AUTHOR', 'ACTIVE');

-- 2. Hệ thống chuyên mục báo chí sinh viên
INSERT INTO `categories` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Thời sự Giảng đường', 'thoi-su-giang-duong', 'Tin tức sự kiện đời sống sinh viên và trường học'),
(2, 'Phóng sự & Điều tra', 'phong-su-dieu-tra', 'Các tuyến bài điều tra, ghi chép chuyên sâu'),
(3, 'Góc nhìn & Bình luận', 'goc-nhin-binh-luan', 'Ý kiến đa chiều, góc nhìn của giới trẻ về các vấn đề xã hội'),
(4, 'Văn hóa & Đời sống', 'van-hoa-doi-song', 'Nghệ thuật, điện ảnh, sách và phong cách sống sinh viên'),
(5, 'Công nghệ & Khởi nghiệp', 'cong-nghe-khoi-nghiep', 'Xu hướng AI, công nghệ mới và dự án khởi nghiệp trẻ');

-- 3. Bài viết mẫu dạng Phóng sự chuyên sâu (Longform) thuộc Tuyến bài
INSERT INTO `posts` (`title`, `slug`, `sapo`, `content`, `thumbnail_url`, `thumbnail_credit`, `byline`, `post_format`, `reading_time`, `series_name`, `series_order`, `is_spotlight`, `status`, `author_id`, `category_id`, `published_at`) VALUES
('Chuyện nghề làm báo thời trí tuệ nhân tạo: Khi ngòi bút đối thoại cùng thuật toán', 
 'chuyen-nghe-lam-bao-thoi-tri-tue-nhan-tao', 
 'Giữa làn sóng bùng nổ của các mô hình ngôn ngữ lớn, những người làm báo trẻ tại giảng đường đang đứng trước bước ngoặt: Tận dụng công nghệ để khai phóng sức sáng tạo hay để AI lấn át bản sắc báo chí?', 
 '<p class="lead font-medium">Báo chí không đơn thuần là truyền tải sự thật, mà là truyền tải sự thật qua lăng kính trắc ẩn của con người. Đó là thứ mà không dòng mã lệnh nào có thể thay thế được.</p><p>Tại các tòa soạn hiện đại, sự xuất hiện của các công cụ hỗ trợ thông minh đã rút ngắn thời gian xử lý dữ liệu từ hàng giờ xuống vài giây. Tuy nhiên, linh hồn của một tác phẩm báo chí vẫn nằm ở những bước chân đi thực địa, những cuộc phỏng vấn đối mặt và cảm xúc chân thật từ hiện trường.</p>', 
 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200', 
 'Ảnh: Getty Images / Báo chí Số', 
 'Hải Đăng (Khoa Báo chí)', 
 'LONGFORM', 
 5, 
 'Báo chí và Công nghệ Tương lai',
 1,
 1, 
 'PUBLISHED', 
 4, 
 2, 
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
