package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.PostDTO;
import com.news.newsportal.service.PersonalizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1", "/api"})
@RequiredArgsConstructor
public class PersonalizationController {

    private final PersonalizationService personalizationService;

    /**
     * 1. ĐỀ XUẤT "DÀNH CHO BẠN" (FOR YOU) - PUBLIC CHO CẢ KHÁCH VÀ THÀNH VIÊN
     * GET /api/v1/public/recommendations/for-you?categoryIds=1,2&excludeIds=5&limit=6
     */
    @GetMapping("/public/recommendations/for-you")
    public ResponseEntity<ApiResponse<List<PostDTO>>> getForYouRecommendations(
            @RequestParam(required = false) String categoryIds,
            @RequestParam(required = false) String excludeIds,
            @RequestParam(defaultValue = "6") int limit,
            Authentication authentication) {

        String username = (authentication != null && authentication.isAuthenticated())
                ? authentication.getName() : null;

        List<Long> parsedCatIds = parseLongList(categoryIds);
        List<Long> parsedExcludeIds = parseLongList(excludeIds);

        List<PostDTO> posts = personalizationService.getPersonalizedRecommendations(
                username, parsedCatIds, parsedExcludeIds, limit);

        return ResponseEntity.ok(ApiResponse.success(posts, "Gợi ý tin bài dành riêng cho bạn"));
    }

    /**
     * 2. ĐỀ XUẤT NỘI DUNG TƯƠNG ĐỒNG THẺ TAG & CHUYÊN MỤC (CONTENT-BASED)
     * GET /api/v1/public/recommendations/related/{postId}?limit=4
     */
    @GetMapping("/public/recommendations/related/{postId}")
    public ResponseEntity<ApiResponse<List<PostDTO>>> getSmartRelatedPosts(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "4") int limit) {

        List<PostDTO> related = personalizationService.getSmartRelatedPosts(postId, limit);
        return ResponseEntity.ok(ApiResponse.success(related, "Tin tức liên quan cùng chủ đề"));
    }

    /**
     * 3. GHI NHẬN LỊCH SỬ ĐỌC BÀI VIẾT (USER)
     * POST /api/v1/user/history/{postId}
     */
    @PostMapping("/user/history/{postId}")
    public ResponseEntity<ApiResponse<String>> recordReading(
            @PathVariable Long postId,
            Authentication authentication) {

        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            personalizationService.recordReading(authentication.getName(), postId);
            return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận lịch sử đọc"));
        }
        return ResponseEntity.ok(ApiResponse.success("Khách vãng lai (Lưu cục bộ trình duyệt)"));
    }

    /**
     * 4. LẤY LỊCH SỬ ĐỌC CỦA TÀI KHOẢN
     * GET /api/v1/user/history?page=0&size=10
     */
    @GetMapping("/user/history")
    public ResponseEntity<ApiResponse<List<PostDTO>>> getReadingHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }

        List<PostDTO> history = personalizationService.getUserReadingHistory(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success(history, "Danh sách bài viết đã đọc gần đây"));
    }

    /**
     * 4b. XÓA TOÀN BỘ LỊCH SỬ ĐỌC CỦA TÀI KHOẢN
     * DELETE /api/v1/user/history
     */
    @DeleteMapping("/user/history")
    public ResponseEntity<ApiResponse<String>> clearReadingHistory(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        personalizationService.clearReadingHistory(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã xóa toàn bộ lịch sử đọc"));
    }

    /**
     * 5. LƯU / BỎ LƯU BÀI VIẾT (BOOKMARK TOGGLE)
     * POST /api/v1/user/bookmarks/{postId}
     */
    @PostMapping("/user/bookmarks/{postId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleBookmark(
            @PathVariable Long postId,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để lưu bài viết"));
        }

        boolean bookmarked = personalizationService.toggleBookmark(authentication.getName(), postId);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("postId", postId, "isBookmarked", bookmarked),
                bookmarked ? "Đã lưu bài viết vào danh sách đọc sau" : "Đã bỏ lưu bài viết"
        ));
    }

    /**
     * 6. LẤY DANH SÁCH BÀI VIẾT ĐÃ LƯU
     * GET /api/v1/user/bookmarks?page=0&size=10
     */
    @GetMapping("/user/bookmarks")
    public ResponseEntity<ApiResponse<List<PostDTO>>> getBookmarks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }

        List<PostDTO> bookmarks = personalizationService.getUserBookmarks(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success(bookmarks, "Danh sách bài viết đã lưu"));
    }

    /**
     * 7. KIỂM TRA TRẠNG THÁI BOOKMARK BÀI VIẾT HIỆN TẠI
     * GET /api/v1/user/bookmarks/status/{postId}
     */
    @GetMapping("/user/bookmarks/status/{postId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkBookmarkStatus(
            @PathVariable Long postId,
            Authentication authentication) {

        String username = (authentication != null && authentication.isAuthenticated())
                ? authentication.getName() : null;

        boolean bookmarked = personalizationService.isBookmarked(username, postId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("postId", postId, "isBookmarked", bookmarked)));
    }

    /**
     * 8. LẤY & LƯU CHỦ ĐỀ QUAN TÂM (ONBOARDING PREFERENCES)
     * GET /api/v1/user/preferences
     * POST /api/v1/user/preferences
     */
    @GetMapping("/user/preferences")
    public ResponseEntity<ApiResponse<List<Long>>> getUserPreferences(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        return ResponseEntity.ok(ApiResponse.success(personalizationService.getUserTopicPreferences(authentication.getName())));
    }

    @PostMapping("/user/preferences")
    public ResponseEntity<ApiResponse<List<Long>>> saveUserPreferences(
            @RequestBody List<Long> categoryIds,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        List<Long> saved = personalizationService.saveUserTopicPreferences(authentication.getName(), categoryIds);
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật sở thích chủ đề thành công"));
    }

    private List<Long> parseLongList(String str) {
        if (str == null || str.trim().isEmpty()) return Collections.emptyList();
        try {
            return Arrays.stream(str.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}

