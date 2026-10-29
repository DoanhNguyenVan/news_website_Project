package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.JwtResponse;
import com.news.newsportal.dto.LoginRequest;
import com.news.newsportal.dto.RegisterRequest;
import com.news.newsportal.dto.SendOtpRequest;
import com.news.newsportal.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @org.springframework.beans.factory.annotation.Value("${oauth2.google.client-id:469382623867-5a89aqvp1e0gno6nirj7amko92jusrf0.apps.googleusercontent.com}")
    private String googleClientId;

    @GetMapping("/google/client-id")
    public ResponseEntity<java.util.Map<String, String>> getGoogleClientId() {
        return ResponseEntity.ok(java.util.Map.of("clientId", googleClientId));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    /**
     * Đăng nhập / Đăng ký nhanh với Google ID Token (GIS)
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<JwtResponse>> authenticateGoogle(@RequestBody com.news.newsportal.dto.GoogleAuthRequest request) {
        JwtResponse response = authService.loginWithGoogle(request.getToken());
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập Google thành công"));
    }

    /**
     * BƯỚC 1: POST /api/v1/auth/send-otp
     * Gửi mã OTP 6 chữ số về Email người dùng (Lưu tạm Redis 5 phút, chưa lưu MySQL)
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        String msg = authService.sendRegistrationOtp(req);
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    /**
     * BƯỚC 2: POST /api/v1/auth/register
     * Nhập mã OTP -> Nếu ĐÚNG mới chính thức tạo User vào MySQL Database
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        String msg = authService.registerWithOtp(registerRequest);
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @GetMapping({"/me", "/profile"})
    public ResponseEntity<ApiResponse<com.news.newsportal.dto.UserDTO>> getCurrentUser(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(ApiResponse.error("Chưa đăng nhập hoặc phiên làm việc đã hết hạn"));
        }
        return ResponseEntity.ok(ApiResponse.success(authService.getCurrentUserProfile(authentication.getName())));
    }

    @PutMapping({"/me", "/profile"})
    public ResponseEntity<ApiResponse<com.news.newsportal.dto.UserDTO>> updateProfile(
            @RequestBody com.news.newsportal.dto.UpdateProfileRequest request,
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        com.news.newsportal.dto.UserDTO updated = authService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật hồ sơ thành công"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody com.news.newsportal.dto.ChangePasswordRequest request,
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        try {
            authService.changePassword(authentication.getName(), request);
            return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getUserStats(
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        return ResponseEntity.ok(ApiResponse.success(authService.getUserStats(authentication.getName())));
    }

    @GetMapping("/comments")
    public ResponseEntity<ApiResponse<java.util.List<com.news.newsportal.dto.CommentDTO>>> getUserComments(
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        return ResponseEntity.ok(ApiResponse.success(authService.getUserComments(authentication.getName())));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success("Đã đăng xuất thành công"));
    }
}
