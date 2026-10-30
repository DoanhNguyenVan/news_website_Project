package com.news.newsportal.config;

import com.news.newsportal.entity.Role;
import com.news.newsportal.entity.User;
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
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 1. Khởi tạo tài khoản quản trị mặc định (chỉ tạo nếu chưa tồn tại)
        createDefaultUserIfNotExists("admin", "admin@newsportal.com", "Quản Trị Kỹ Thuật", Role.SUPER_ADMIN);
        createDefaultUserIfNotExists("editor_chief", "chief@newsportal.com", "Tổng Biên Tập", Role.EDITOR_IN_CHIEF);
        createDefaultUserIfNotExists("editor1", "editor1@newsportal.com", "Trưởng Ban Biên Tập", Role.EDITOR);
        createDefaultUserIfNotExists("author1", "author1@newsportal.com", "Phóng viên Nguyễn Văn A", Role.AUTHOR);
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
}
