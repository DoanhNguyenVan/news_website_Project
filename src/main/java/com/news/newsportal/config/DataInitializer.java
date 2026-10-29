package com.news.newsportal.config;

import com.news.newsportal.entity.Category;
import com.news.newsportal.entity.Role;
import com.news.newsportal.entity.User;
import com.news.newsportal.repository.CategoryRepository;
import com.news.newsportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 1. Khởi tạo tài khoản quản trị mặc định (chỉ tạo nếu chưa tồn tại)
        createDefaultUserIfNotExists("admin", "admin@newsportal.com", "Quản Trị Kỹ Thuật", Role.SUPER_ADMIN);
        createDefaultUserIfNotExists("editor_chief", "chief@newsportal.com", "Tổng Biên Tập", Role.EDITOR_IN_CHIEF);
        createDefaultUserIfNotExists("editor1", "editor1@newsportal.com", "Trưởng Ban Biên Tập", Role.EDITOR);
        createDefaultUserIfNotExists("author1", "author1@newsportal.com", "Phóng viên Nguyễn Văn A", Role.AUTHOR);

        // 2. Khởi tạo Chuyên mục mặc định nếu chưa có
        initDefaultCategories();
    }

    private void createDefaultUserIfNotExists(String username, String email, String fullName, Role role) {
        if (!userRepository.existsByUsername(username)) {
            userRepository.save(User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .fullName(fullName)
                    .authProvider("LOCAL")
                    .role(role)
                    .isEmailVerified(true)
                    .status("ACTIVE")
                    .build());
            log.info("Khởi tạo tài khoản mặc định: {} ({})", username, role);
        }
    }

    private void initDefaultCategories() {
        if (categoryRepository.count() == 0) {
            categoryRepository.save(Category.builder().name("Thời sự Giảng đường").slug("thoi-su-giang-duong").description("Tin tức sự kiện đời sống sinh viên và trường học").build());
            categoryRepository.save(Category.builder().name("Phóng sự & Điều tra").slug("phong-su-dieu-tra").description("Các tuyến bài điều tra, ghi chép chuyên sâu").build());
            categoryRepository.save(Category.builder().name("Góc nhìn & Bình luận").slug("goc-nhin-binh-luan").description("Ý kiến đa chiều, góc nhìn của giới trẻ về các vấn đề xã hội").build());
            categoryRepository.save(Category.builder().name("Văn hóa & Đời sống").slug("van-hoa-doi-song").description("Nghệ thuật, điện ảnh, sách và phong cách sống sinh viên").build());
            categoryRepository.save(Category.builder().name("Công nghệ & Khởi nghiệp").slug("cong-nghe-khoi-nghiep").description("Xu hướng AI, công nghệ mới và dự án khởi nghiệp trẻ").build());
            log.info("Khởi tạo 5 chuyên mục báo chí sinh viên mặc định thành công.");
        }
    }
}
