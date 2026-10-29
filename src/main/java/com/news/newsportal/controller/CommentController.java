package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.CommentDTO;
import com.news.newsportal.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/comments", "/api/v1/comments"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommentController {

    private final CommentService commentService;

    /**
     * API gửi bình luận mới (Yêu cầu độc giả đã đăng nhập)
     * Payload: { postId, content, parentId }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CommentDTO>> createComment(
            @RequestBody CommentDTO dto,
            org.springframework.security.core.Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        CommentDTO created = commentService.addComment(dto, currentUsername);
        return ResponseEntity.ok(ApiResponse.success(created, "Bình luận của bạn đã được đăng thành công!"));
    }

    /**
     * API lấy danh sách bình luận đã duyệt (APPROVED) theo bài viết dạng phân cấp cây
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<ApiResponse<List<CommentDTO>>> getCommentsByPost(@PathVariable Long postId) {
        List<CommentDTO> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(ApiResponse.success(comments, "Lấy danh sách bình luận thành công"));
    }

    /**
     * API alias lấy danh sách bình luận
     */
    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<List<CommentDTO>>> getCommentsByPostAlias(@PathVariable Long postId) {
        List<CommentDTO> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(ApiResponse.success(comments, "Lấy danh sách bình luận thành công"));
    }
}
