package com.news.newsportal.service;

import com.news.newsportal.dto.GoogleTokenResponse;
import com.news.newsportal.dto.GoogleUserInfoResponse;
import com.news.newsportal.dto.JwtResponse;
import com.news.newsportal.dto.SocialAuthUrlResponse;
import com.news.newsportal.entity.Role;
import com.news.newsportal.entity.User;
import com.news.newsportal.repository.UserRepository;
import com.news.newsportal.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocialAuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    // Google Configuration
    @Value("${oauth2.google.client-id:}")
    private String googleClientId;

    @Value("${oauth2.google.client-secret:}")
    private String googleClientSecret;

    @Value("${oauth2.google.redirect-uri:http://localhost:8080/api/v1/users/auth/social/callback}")
    private String googleRedirectUri;

    @Value("${oauth2.google.authorization-uri:https://accounts.google.com/o/oauth2/v2/auth}")
    private String googleAuthUri;

    @Value("${oauth2.google.token-uri:https://oauth2.googleapis.com/token}")
    private String googleTokenUri;

    @Value("${oauth2.google.user-info-uri:https://www.googleapis.com/oauth2/v3/userinfo}")
    private String googleUserInfoUri;

    @Value("${oauth2.google.scope:openid email profile}")
    private String googleScope;

    // Facebook Configuration
    @Value("${oauth2.facebook.client-id:}")
    private String facebookClientId;

    @Value("${oauth2.facebook.client-secret:}")
    private String facebookClientSecret;

    @Value("${oauth2.facebook.redirect-uri:http://localhost:8080/api/v1/users/auth/social/callback}")
    private String facebookRedirectUri;

    @Value("${oauth2.facebook.authorization-uri:https://www.facebook.com/v19.0/dialog/oauth}")
    private String facebookAuthUri;

    @Value("${oauth2.facebook.token-uri:https://graph.facebook.com/v19.0/oauth/access_token}")
    private String facebookTokenUri;

    @Value("${oauth2.facebook.user-info-uri:https://graph.facebook.com/me?fields=id,name,email,picture.width(200).height(200)}")
    private String facebookUserInfoUri;

    @Value("${oauth2.facebook.scope:email,public_profile}")
    private String facebookScope;

    /**
     * BƯỚC 1 & 2: Sinh Authorization URL chuẩn cho Google / Facebook
     */
    public SocialAuthUrlResponse generateAuthUrl(String loginType) {
        String type = (loginType != null) ? loginType.trim().toLowerCase() : "google";
        String authUrl;

        if ("facebook".equals(type)) {
            authUrl = UriComponentsBuilder.fromHttpUrl(facebookAuthUri)
                    .queryParam("client_id", facebookClientId)
                    .queryParam("redirect_uri", facebookRedirectUri)
                    .queryParam("response_type", "code")
                    .queryParam("scope", facebookScope)
                    .encode()
                    .toUriString();
        } else {
            // Default to Google
            type = "google";
            authUrl = UriComponentsBuilder.fromHttpUrl(googleAuthUri)
                    .queryParam("client_id", googleClientId)
                    .queryParam("redirect_uri", googleRedirectUri)
                    .queryParam("response_type", "code")
                    .queryParam("scope", googleScope)
                    .queryParam("access_type", "offline")
                    .queryParam("prompt", "consent")
                    .encode()
                    .toUriString();
        }

        return SocialAuthUrlResponse.builder()
                .loginType(type)
                .authorizationUrl(authUrl)
                .build();
    }

    /**
     * BƯỚC 3, 4 & 5: Nhận Authorization Code -> Đổi Token -> Lấy UserInfo -> Đồng bộ DB -> Cấp JWT
     */
    @Transactional
    public JwtResponse processSocialCallback(String code, String loginType) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Mã xác thực Authorization Code không được để trống!");
        }

        String type = (loginType != null) ? loginType.trim().toLowerCase() : "google";
        if ("facebook".equals(type)) {
            return processFacebookLogin(code);
        } else {
            return processGoogleLogin(code);
        }
    }

    /**
     * Luồng Google OAuth2 Authorization Code
     */
    private JwtResponse processGoogleLogin(String code) {
        log.info("Processing Google OAuth2 callback with authorization code: {}", code.substring(0, Math.min(10, code.length())) + "...");

        // 5.1 Đổi code lấy Access Token
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", googleClientId);
        body.add("client_secret", googleClientSecret);
        body.add("redirect_uri", googleRedirectUri);
        body.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(body, headers);
        ResponseEntity<GoogleTokenResponse> tokenResponse;
        try {
            tokenResponse = restTemplate.postForEntity(googleTokenUri, tokenRequest, GoogleTokenResponse.class);
        } catch (Exception e) {
            log.error("Lỗi khi đổi Google Authorization Code lấy Token: {}", e.getMessage());
            throw new IllegalArgumentException("Không thể xác thực mã Code với máy chủ Google: " + e.getMessage());
        }

        GoogleTokenResponse tokenBody = tokenResponse.getBody();
        if (tokenBody == null || tokenBody.getAccessToken() == null) {
            throw new IllegalArgumentException("Không nhận được Access Token từ Google!");
        }

        // 5.2 Lấy thông tin User Info bằng Access Token
        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.setBearerAuth(tokenBody.getAccessToken());
        HttpEntity<?> userRequest = new HttpEntity<>(userHeaders);

        ResponseEntity<GoogleUserInfoResponse> userResponse;
        try {
            userResponse = restTemplate.exchange(googleUserInfoUri, HttpMethod.GET, userRequest, GoogleUserInfoResponse.class);
        } catch (Exception e) {
            log.error("Lỗi khi lấy thông tin người dùng từ Google: {}", e.getMessage());
            throw new IllegalArgumentException("Không thể lấy thông tin người dùng từ Google: " + e.getMessage());
        }

        GoogleUserInfoResponse userInfo = userResponse.getBody();
        if (userInfo == null || userInfo.getEmail() == null) {
            throw new IllegalArgumentException("Google không cung cấp thông tin Email hợp lệ!");
        }

        // 5.3 Đồng bộ Database & Cấp phát JWT
        return syncSocialUserAndGenerateTokens(
                userInfo.getSub(),
                null,
                userInfo.getEmail(),
                userInfo.getName(),
                userInfo.getPicture(),
                "GOOGLE"
        );
    }

    /**
     * Luồng Facebook OAuth2 Authorization Code
     */
    private JwtResponse processFacebookLogin(String code) {
        log.info("Processing Facebook OAuth2 callback with authorization code...");

        // 5.1 Đổi code lấy Facebook Access Token
        String tokenUrl = UriComponentsBuilder.fromHttpUrl(facebookTokenUri)
                .queryParam("client_id", facebookClientId)
                .queryParam("client_secret", facebookClientSecret)
                .queryParam("redirect_uri", facebookRedirectUri)
                .queryParam("code", code)
                .toUriString();

        Map<String, Object> tokenResp;
        try {
            tokenResp = restTemplate.getForObject(tokenUrl, Map.class);
        } catch (Exception e) {
            log.error("Lỗi khi lấy Access Token từ Facebook: {}", e.getMessage());
            throw new IllegalArgumentException("Không thể đổi Authorization Code với Facebook: " + e.getMessage());
        }

        if (tokenResp == null || !tokenResp.containsKey("access_token")) {
            throw new IllegalArgumentException("Không nhận được Access Token từ Facebook!");
        }

        String accessToken = (String) tokenResp.get("access_token");

        // 5.2 Lấy thông tin User Info từ Graph API
        String userInfoUrl = UriComponentsBuilder.fromHttpUrl(facebookUserInfoUri)
                .queryParam("access_token", accessToken)
                .toUriString();

        Map<String, Object> userInfo;
        try {
            userInfo = restTemplate.getForObject(userInfoUrl, Map.class);
        } catch (Exception e) {
            log.error("Lỗi khi lấy thông tin Facebook Profile: {}", e.getMessage());
            throw new IllegalArgumentException("Không thể lấy thông tin từ Facebook Profile: " + e.getMessage());
        }

        if (userInfo == null) {
            throw new IllegalArgumentException("Không thể đọc hồ sơ Facebook của người dùng!");
        }

        String facebookId = (String) userInfo.get("id");
        String name = (String) userInfo.get("name");
        String email = (String) userInfo.get("email");
        if (email == null || email.isBlank()) {
            email = "fb_" + facebookId + "@facebook.newsportal.vn";
        }

        String pictureUrl = null;
        if (userInfo.containsKey("picture")) {
            Map<String, Object> picMap = (Map<String, Object>) userInfo.get("picture");
            if (picMap != null && picMap.containsKey("data")) {
                Map<String, Object> dataMap = (Map<String, Object>) picMap.get("data");
                if (dataMap != null) {
                    pictureUrl = (String) dataMap.get("url");
                }
            }
        }

        // 5.3 Đồng bộ Database & Cấp phát JWT
        return syncSocialUserAndGenerateTokens(
                null,
                facebookId,
                email,
                name,
                pictureUrl,
                "FACEBOOK"
        );
    }

    /**
     * Logic đồng bộ tài khoản người dùng vào MySQL và sinh JWT
     */
    private JwtResponse syncSocialUserAndGenerateTokens(
            String googleAccountId,
            String facebookAccountId,
            String email,
            String fullName,
            String avatarUrl,
            String provider) {

        Optional<User> userOptional = Optional.empty();

        // 1. Tìm theo Social Account ID nếu có
        if (googleAccountId != null && !googleAccountId.isBlank()) {
            userOptional = userRepository.findByGoogleAccountId(googleAccountId);
        } else if (facebookAccountId != null && !facebookAccountId.isBlank()) {
            userOptional = userRepository.findByFacebookAccountId(facebookAccountId);
        }

        // 2. Tìm theo Email nếu chưa liên kết ID mạng xã hội
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(email);
        }

        User user;
        if (userOptional.isEmpty()) {
            // Tự động sinh username duy nhất từ email
            String baseUsername = email.contains("@") ? email.substring(0, email.indexOf('@')) : "user";
            baseUsername = baseUsername.replaceAll("[^a-zA-Z0-9_]", "");
            String finalUsername = baseUsername;
            int count = 1;
            while (userRepository.existsByUsername(finalUsername)) {
                finalUsername = baseUsername + count++;
            }

            user = User.builder()
                    .username(finalUsername)
                    .email(email)
                    .fullName(fullName != null ? fullName : finalUsername)
                    .avatarUrl(avatarUrl)
                    .role(Role.USER)
                    .status("ACTIVE")
                    .isEmailVerified(true)
                    .authProvider(provider)
                    .googleAccountId(googleAccountId)
                    .facebookAccountId(facebookAccountId)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .build();

            userRepository.save(user);
            log.info("Tạo mới tài khoản mạng xã hội [{}] thành công cho: {}", provider, email);
        } else {
            user = userOptional.get();

            // Cập nhật thông tin nếu có thay đổi
            boolean updated = false;
            if (googleAccountId != null && user.getGoogleAccountId() == null) {
                user.setGoogleAccountId(googleAccountId);
                updated = true;
            }
            if (facebookAccountId != null && user.getFacebookAccountId() == null) {
                user.setFacebookAccountId(facebookAccountId);
                updated = true;
            }
            if (avatarUrl != null && (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())) {
                user.setAvatarUrl(avatarUrl);
                updated = true;
            }
            if (fullName != null && (user.getFullName() == null || user.getFullName().isBlank())) {
                user.setFullName(fullName);
                updated = true;
            }

            if (updated) {
                userRepository.save(user);
                log.info("Cập nhật thông tin liên kết mạng xã hội cho user: {}", user.getUsername());
            }
        }

        // Kiểm tra trạng thái tài khoản
        if ("BANNED".equalsIgnoreCase(user.getStatus()) || "INACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Tài khoản của bạn đã bị khóa hoặc ngừng kích hoạt trên hệ thống!");
        }

        // Sinh JWT Tokens
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

        String accessToken = jwtProvider.generateToken(authentication);
        String refreshToken = jwtProvider.generateRefreshToken(authentication);

        return JwtResponse.builder()
                .accessToken(accessToken)
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
}

