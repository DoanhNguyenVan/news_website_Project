package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.PostDTO;
import com.news.newsportal.service.AdminPostService;
import com.news.newsportal.service.MediaUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class EditorialCMSController {

    private final AdminPostService adminPostService;
    private final MediaUploadService mediaUploadService;
    private final com.news.newsportal.service.DocxImportService docxImportService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.success(adminPostService.getDashboardStats()));
    }

    @PostMapping("/posts/import-docx")
    public ResponseEntity<ApiResponse<com.news.newsportal.dto.DocxImportResultDTO>> importDocxPost(@RequestParam("file") MultipartFile file) throws IOException {
        com.news.newsportal.dto.DocxImportResultDTO result = docxImportService.convertDocxToCleanHtml(file);
        return ResponseEntity.ok(ApiResponse.success(result, "Chuyển đổi bài viết từ file Word (.docx) thành công"));
    }

    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<PostDTO>> createPost(@RequestBody PostDTO dto, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(ApiResponse.success(adminPostService.createPost(dto, username), "Tạo bài viết thành công"));
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<PostDTO>>> getAdminPosts(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.success(adminPostService.getAdminPosts(status, page, size, username)));
    }

    @GetMapping("/posts/my-posts")
    public ResponseEntity<ApiResponse<Page<PostDTO>>> getMyPosts(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.success(adminPostService.getAdminPosts(status, page, size, username)));
    }

    @PatchMapping("/posts/{id}/status")
    public ResponseEntity<ApiResponse<String>> updatePostStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String rejectionReason,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        adminPostService.updatePostStatus(id, status, rejectionReason, username);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái bài viết thành công"));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<PostDTO>> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminPostService.getPostById(id)));
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<PostDTO>> updatePost(
            @PathVariable Long id, 
            @RequestBody PostDTO dto, 
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.success(adminPostService.updatePost(id, dto, username), "Cập nhật bài viết thành công"));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<String>> deletePost(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        adminPostService.deletePost(id, username);
        return ResponseEntity.ok(ApiResponse.success("Xóa bài viết thành công"));
    }

    @PatchMapping("/posts/{id}/spotlight")
    public ResponseEntity<ApiResponse<Boolean>> toggleSpotlight(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        boolean val = adminPostService.toggleSpotlight(id, username);
        return ResponseEntity.ok(ApiResponse.success(val, val ? "Đã ghim bài viết làm Spotlight" : "Đã bỏ ghim Spotlight"));
    }

    @PatchMapping("/posts/{id}/trending")
    public ResponseEntity<ApiResponse<Boolean>> toggleTrending(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        boolean val = adminPostService.toggleTrending(id, username);
        return ResponseEntity.ok(ApiResponse.success(val, val ? "Đã ghim bài viết làm Xu hướng" : "Đã bỏ ghim Xu hướng"));
    }

    @PostMapping("/media/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadMedia(@RequestParam("file") MultipartFile file) throws IOException {
        String url = mediaUploadService.uploadMedia(file);
        Map<String, String> res = new HashMap<>();
        res.put("url", url);
        return ResponseEntity.ok(ApiResponse.success(res, "Tải tập tin thành công"));
    }
}
