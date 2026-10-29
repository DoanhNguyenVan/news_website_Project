package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.entity.Comment;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping({"/api/admin/comments", "/api/v1/admin/comments"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class CommentAdminController {

    private final CommentRepository commentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Comment>>> getAllComments(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            if ("HIDDEN".equalsIgnoreCase(status)) {
                List<Comment> hidden = commentRepository.findByStatusOrderByCreatedAtDesc("HIDDEN");
                List<Comment> rejected = commentRepository.findByStatusOrderByCreatedAtDesc("REJECTED");
                List<Comment> result = new ArrayList<>(hidden);
                result.addAll(rejected);
                result.sort((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                });
                return ResponseEntity.ok(ApiResponse.success(result));
            }
            return ResponseEntity.ok(ApiResponse.success(commentRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase())));
        }
        return ResponseEntity.ok(ApiResponse.success(commentRepository.findAllByOrderByCreatedAtDesc()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> moderateComment(@PathVariable Long id, @RequestParam String status) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bình luận không tồn tại"));

        String newStatus = "HIDDEN".equalsIgnoreCase(status) ? "HIDDEN" : "APPROVED";
        comment.setStatus(newStatus);
        commentRepository.save(comment);

        String msg = "HIDDEN".equals(newStatus) ? "Đã ẩn bình luận thành công" : "Đã hiển thị bình luận thành công";
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteComment(@PathVariable Long id) {
        commentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bình luận thành công"));
    }
}
