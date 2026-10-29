package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.CommentDTO;
import com.news.newsportal.dto.PostDTO;
import com.news.newsportal.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/news")
@RequiredArgsConstructor
public class PublicNewsController {

    private final NewsService newsService;

    @GetMapping("/homepage")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHomepageNews() {
        return ResponseEntity.ok(ApiResponse.success(newsService.getHomepageNews()));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<java.util.List<com.news.newsportal.entity.Category>>> getPublicCategories() {
        return ResponseEntity.ok(ApiResponse.success(newsService.getPublicCategories()));
    }

    @GetMapping("/category/{slug}")
    public ResponseEntity<ApiResponse<Page<PostDTO>>> getPostsByCategory(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(newsService.getPostsByCategory(slug, page, size)));
    }

    @GetMapping("/article/{slug}")
    public ResponseEntity<ApiResponse<PostDTO>> getArticleBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(newsService.getArticleBySlug(slug)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<PostDTO>>> searchPosts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(newsService.searchPosts(q, page, size)));
    }

    @GetMapping({"/search-suggestions", "/posts/search-suggestions"})
    public ResponseEntity<ApiResponse<java.util.List<PostDTO>>> getSearchSuggestions(
            @RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(ApiResponse.success(newsService.getSearchSuggestions(q)));
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<java.util.List<CommentDTO>>> getPostComments(@PathVariable Long postId) {
        return ResponseEntity.ok(ApiResponse.success(newsService.getCommentsByPostId(postId)));
    }

    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<CommentDTO>> createComment(
            @RequestBody CommentDTO dto,
            org.springframework.security.core.Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.success(newsService.addComment(dto, currentUsername), "Gửi bình luận thành công"));
    }
}
