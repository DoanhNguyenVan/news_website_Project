package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.JwtResponse;
import com.news.newsportal.dto.SocialAuthUrlResponse;
import com.news.newsportal.service.SocialAuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping({"/api/v1/users/auth", "/api/v1/auth"})
@RequiredArgsConstructor
public class SocialAuthController {

    private final SocialAuthService socialAuthService;

    /**
     * BƯỚC 1 & 2: API Tạo URL xác thực OAuth2 Authorization Code Flow
     * GET /api/v1/users/auth/social-login?login_type=google (hoặc facebook)
     */
    @GetMapping("/social-login")
    public ResponseEntity<ApiResponse<SocialAuthUrlResponse>> getSocialLoginUrl(
            @RequestParam(name = "login_type", defaultValue = "google") String loginType) {
        SocialAuthUrlResponse response = socialAuthService.generateAuthUrl(loginType);
        return ResponseEntity.ok(ApiResponse.success(response, "Khởi tạo URL xác thực OAuth2 thành công"));
    }

    /**
     * BƯỚC 3, 4 & 5: API Nhận Authorization Code -> Đổi Token -> Lấy UserInfo -> Cấp JWT
     * Hỗ trợ cả Client Fetch API (JSON) và Browser Redirect trực tiếp về trang chủ
     * GET /api/v1/users/auth/social/callback?code=...&login_type=google
     */
    @GetMapping("/social/callback")
    public Object handleSocialCallback(
            @RequestParam("code") String code,
            @RequestParam(name = "login_type", defaultValue = "google") String loginType,
            @RequestHeader(value = "Accept", required = false) String acceptHeader,
            HttpServletResponse response) throws IOException {
        try {
            JwtResponse jwtResponse = socialAuthService.processSocialCallback(code, loginType);

            if (acceptHeader != null && acceptHeader.contains("application/json")) {
                return ResponseEntity.ok(ApiResponse.success(jwtResponse, "Đăng nhập mạng xã hội thành công"));
            }

            String redirectUrl = "/index.html?social_auth=success"
                    + "&accessToken=" + URLEncoder.encode(jwtResponse.getAccessToken(), StandardCharsets.UTF_8)
                    + "&refreshToken=" + URLEncoder.encode(jwtResponse.getRefreshToken(), StandardCharsets.UTF_8)
                    + "&username=" + URLEncoder.encode(jwtResponse.getUsername(), StandardCharsets.UTF_8)
                    + "&email=" + URLEncoder.encode(jwtResponse.getEmail(), StandardCharsets.UTF_8)
                    + "&role=" + URLEncoder.encode(jwtResponse.getRole(), StandardCharsets.UTF_8);
            response.sendRedirect(redirectUrl);
            return null;
        } catch (Exception e) {
            log.error("Social login callback error: {}", e.getMessage());
            if (acceptHeader != null && acceptHeader.contains("application/json")) {
                return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
            }
            response.sendRedirect("/index.html?social_auth=error&message=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
            return null;
        }
    }
}
