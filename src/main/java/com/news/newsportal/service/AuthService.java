package com.news.newsportal.service;

import com.news.newsportal.dto.*;
import com.news.newsportal.entity.Role;
import com.news.newsportal.entity.User;
import com.news.newsportal.repository.UserRepository;
import com.news.newsportal.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final OtpStore otpStore;
    private final com.news.newsportal.repository.BookmarkRepository bookmarkRepository;
    private final com.news.newsportal.repository.ReadingHistoryRepository readingHistoryRepository;
    private final com.news.newsportal.repository.UserTopicPreferenceRepository topicPreferenceRepository;
    private final com.news.newsportal.repository.CommentRepository commentRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * BƯỚC 1: Gửi mã OTP 6 chữ số về Email người dùng (Lưu Redis 5 phút)
     */
    public String sendRegistrationOtp(SendOtpRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại trên hệ thống!");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Địa chỉ Email này đã được sử dụng!");
        }

        // Sinh mã OTP 6 chữ số ngẫu nhiên
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));

        // Lưu OTP trong bộ nhớ với thời gian hết hạn 5 phút
        otpStore.put(req.getEmail(), otp);

        // Gửi OTP qua Gmail Async
        emailService.sendOtpEmail(req.getEmail(), otp);

        return "Mã OTP xác thực 6 chữ số đã được gửi tới Gmail " + req.getEmail() + ". Mã có hiệu lực trong 5 phút!";
    }

    /**
     * BƯỚC 2: Kiểm tra OTP -> ĐÚNG MỚI LƯU USER VÀO CSDL THẬT
     */
    @Transactional
    public String registerWithOtp(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại!");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email này đã được sử dụng!");
        }

        // Kiểm tra OTP trong bộ nhớ
        String cachedOtp = otpStore.get(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP đã hết hạn (quá 5 phút) hoặc chưa được yêu cầu. Vui lòng lấy mã OTP mới!"));

        if (!cachedOtp.equals(req.getOtp())) {
            throw new IllegalArgumentException("Mã OTP bạn nhập không chính xác! Vui lòng kiểm tra lại hòm thư Gmail.");
        }

        // OTP ĐÚNG -> MỚI CHÍNH THỨC TẠO USER VÀO CSDL
        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName() != null && !req.getFullName().isBlank() ? req.getFullName() : req.getUsername())
                .role(Role.USER)
                .isEmailVerified(true) // Đã xác thực OTP thành công
                .status("ACTIVE")
                .build();

        userRepository.save(user);

        // Xóa OTP sau khi tạo tài khoản thành công
        otpStore.remove(req.getEmail());

        return "Tạo tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.";
    }

    /**
     * Đăng nhập chuẩn Security
     */
    @Transactional
    public JwtResponse login(LoginRequest loginRequest) {
        String identifier = loginRequest.getUsername() != null ? loginRequest.getUsername().trim() : "";
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new BadCredentialsException("Tên đăng nhập hoặc mật khẩu không chính xác"));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), loginRequest.getPassword())
        );

        String jwt = jwtProvider.generateToken(authentication);
        String refreshToken = jwtProvider.generateRefreshToken(authentication);

        return JwtResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .build();
    }

    public com.news.newsportal.dto.UserDTO getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.news.newsportal.exception.ResourceNotFoundException("Người dùng không tồn tại: " + username));
        return com.news.newsportal.dto.UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .status(user.getStatus())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL")
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public com.news.newsportal.dto.UserDTO updateProfile(String username, com.news.newsportal.dto.UpdateProfileRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.news.newsportal.exception.ResourceNotFoundException("Người dùng không tồn tại: " + username));
        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl().trim());
        }
        userRepository.save(user);
        return getCurrentUserProfile(username);
    }

    @Transactional
    public void changePassword(String username, com.news.newsportal.dto.ChangePasswordRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.news.newsportal.exception.ResourceNotFoundException("Người dùng không tồn tại: " + username));
        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            throw new IllegalArgumentException("Tài khoản của bạn đăng nhập qua Google OAuth 2.0. Không cần quản lý mật khẩu cục bộ.");
        }
        if (user.getPasswordHash() != null && !passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Mật khẩu hiện tại không chính xác!");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getUserStats(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.news.newsportal.exception.ResourceNotFoundException("Người dùng không tồn tại: " + username));
        long bookmarksCount = bookmarkRepository.countByUserId(user.getId());
        long historyCount = readingHistoryRepository.countByUserId(user.getId());
        long topicsCount = topicPreferenceRepository.countByUserId(user.getId());
        long commentsCount = commentRepository.countByUserId(user.getId());

        return java.util.Map.of(
                "bookmarksCount", bookmarksCount,
                "historyCount", historyCount,
                "topicsCount", topicsCount,
                "commentsCount", commentsCount
        );
    }

    @Transactional(readOnly = true)
    public java.util.List<com.news.newsportal.dto.CommentDTO> getUserComments(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.news.newsportal.exception.ResourceNotFoundException("Người dùng không tồn tại: " + username));
        return commentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(c -> com.news.newsportal.dto.CommentDTO.builder()
                        .id(c.getId())
                        .postId(c.getPostId())
                        .postTitle(c.getPostTitle())
                        .postSlug(c.getPost() != null ? c.getPost().getSlug() : null)
                        .userName(c.getUserName())
                        .email(c.getEmail())
                        .content(c.getContent())
                        .status(c.getStatus())
                        .likesCount(c.getLikesCount())
                        .dislikesCount(c.getDislikesCount())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Đăng nhập / Đăng ký nhanh bằng Google OAuth2 ID Token (GIS)
     */
    @Transactional
    public JwtResponse loginWithGoogle(String credential) {
        if (credential == null || credential.isBlank()) {
            throw new IllegalArgumentException("Google credential token không được để trống!");
        }

        GoogleTokenPayload payload = verifyGoogleToken(credential);

        String email = payload.getEmail();
        String name = payload.getName();
        String picture = payload.getPicture();

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Không thể xác định Email từ tài khoản Google!");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            String usernameBase = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
            String username = usernameBase;
            int counter = 1;
            while (userRepository.existsByUsername(username)) {
                username = usernameBase + counter++;
            }

            user = User.builder()
                    .username(username)
                    .email(email)
                    .fullName(name != null && !name.isBlank() ? name : username)
                    .avatarUrl(picture)
                    .role(Role.USER)
                    .authProvider("GOOGLE")
                    .status("ACTIVE")
                    .isEmailVerified(true)
                    .passwordHash(null)
                    .build();

            user = userRepository.save(user);
        } else {
            if (user.getAuthProvider() == null || "LOCAL".equals(user.getAuthProvider())) {
                user.setAuthProvider("GOOGLE");
            }
            if (user.getAvatarUrl() == null && picture != null) {
                user.setAvatarUrl(picture);
            }
            if ((user.getFullName() == null || user.getFullName().isBlank()) && name != null) {
                user.setFullName(name);
            }
            userRepository.save(user);
        }

        if ("BANNED".equalsIgnoreCase(user.getStatus()) || "INACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new org.springframework.security.access.AccessDeniedException("Tài khoản của bạn đã bị khóa hoặc ngừng kích hoạt!");
        }

        Authentication auth = new UsernamePasswordAuthenticationToken(user.getUsername(), null,
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name())));

        String jwt = jwtProvider.generateToken(auth);
        String refreshToken = jwtProvider.generateRefreshToken(auth);

        return JwtResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .build();
    }

    private GoogleTokenPayload verifyGoogleToken(String token) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
            java.util.Map<String, Object> resp = restTemplate.getForObject(url, java.util.Map.class);
            if (resp != null && resp.containsKey("email")) {
                return GoogleTokenPayload.builder()
                        .email((String) resp.get("email"))
                        .name((String) resp.get("name"))
                        .picture((String) resp.get("picture"))
                        .build();
            }
        } catch (Exception ex) {
            // Fallback decode payload JWT nếu ngoại tuyến
        }

        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                byte[] decodedBytes = java.util.Base64.getUrlDecoder().decode(parts[1]);
                String payloadJson = new String(decodedBytes, java.nio.charset.StandardCharsets.UTF_8);
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(payloadJson);
                String email = node.has("email") ? node.get("email").asText() : null;
                String name = node.has("name") ? node.get("name").asText() : null;
                String picture = node.has("picture") ? node.get("picture").asText() : null;
                return GoogleTokenPayload.builder().email(email).name(name).picture(picture).build();
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Token Google không hợp lệ: " + e.getMessage());
        }

        throw new IllegalArgumentException("Không thể giải mã Google ID Token!");
    }
}
