package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.CommentDTO;
import com.news.newsportal.entity.Comment;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/admin/comments", "/api/v1/admin/comments"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class CommentAdminController {

    private final CommentRepository commentRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<CommentDTO>>> getAllComments(@RequestParam(required = false) String status) {
        List<Comment> comments;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            if ("HIDDEN".equalsIgnoreCase(status)) {
                comments = commentRepository.findHiddenWithPostOrderByCreatedAtDesc();
            } else {
                comments = commentRepository.findByStatusWithPostOrderByCreatedAtDesc(status.toUpperCase());
            }
        } else {
            comments = commentRepository.findAllWithPostOrderByCreatedAtDesc();
        }

        List<CommentDTO> dtos = comments.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PatchMapping("/{id}/status")
    @Transactional
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
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Hệ thống không cho phép xóa bình luận. Quản trị viên chỉ có quyền Ẩn bình luận vi phạm!"));
    }

    private CommentDTO mapToDTO(Comment c) {
        return CommentDTO.builder()
                .id(c.getId())
                .postId(c.getPost() != null ? c.getPost().getId() : null)
                .postTitle(c.getPost() != null ? c.getPost().getTitle() : null)
                .postSlug(c.getPost() != null ? c.getPost().getSlug() : null)
                .userName(c.getUserName())
                .email(c.getEmail())
                .content(c.getContent())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .status(c.getStatus() != null ? c.getStatus() : "APPROVED")
                .likesCount(c.getLikesCount() != null ? c.getLikesCount() : 0)
                .dislikesCount(c.getDislikesCount() != null ? c.getDislikesCount() : 0)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
