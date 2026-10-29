package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SystemSettingsController {

    private final CacheManager cacheManager;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getSystemSettings() {
        Map<String, String> settings = new HashMap<>();
        settings.put("siteName", "News Portal Báo Chí");
        settings.put("siteDescription", "Hệ thống tin tức điện tử hiệu năng cao");
        settings.put("contactEmail", "contact@newsportal.com");
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    /**
     * API POST /api/v1/admin/settings/clear-cache
     * Xóa sạch toàn bộ cache của ứng dụng
     */
    @PostMapping("/clear-cache")
    public ResponseEntity<ApiResponse<String>> clearAllCache() {
        cacheManager.getCacheNames().forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
            }
        });
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sạch toàn bộ cache thành công!"));
    }
}
