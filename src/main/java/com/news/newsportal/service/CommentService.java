package com.news.newsportal.service;

import com.news.newsportal.dto.CommentDTO;
import com.news.newsportal.entity.Comment;
import com.news.newsportal.entity.Post;
import com.news.newsportal.entity.User;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.CommentRepository;
import com.news.newsportal.repository.PostRepository;
import com.news.newsportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * Thêm bình luận mới - Bắt buộc Độc giả đã đăng nhập (authenticated), tự động duyệt (APPROVED).
     */
    @Transactional
    public CommentDTO addComment(CommentDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
        return addComment(dto, currentUsername);
    }

    @Transactional
    public CommentDTO addComment(CommentDTO dto, String currentUsername) {
        if (currentUsername == null || currentUsername.isBlank() || "anonymousUser".equalsIgnoreCase(currentUsername)) {
            throw new IllegalArgumentException("Vui lòng đăng nhập tài khoản để tham gia bình luận!");
        }

        User user = userRepository.findByUsername(currentUsername)
                .or(() -> userRepository.findByEmail(currentUsername))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản người dùng!"));

        if ("BLOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Tài khoản của bạn đã bị tạm khóa chức năng bình luận!");
        }

        if (dto.getPostId() == null) {
            throw new IllegalArgumentException("Mã bài viết (postId) không được để trống!");
        }

        Post post = postRepository.findById(dto.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại (ID: " + dto.getPostId() + ")"));

        if (Boolean.FALSE.equals(post.getAllowComments())) {
            throw new IllegalArgumentException("Bài viết này đã tắt tính năng bình luận!");
        }

        // Bảo mật XSS và Validation nội dung bình luận (5 - 1000 ký tự)
        String rawContent = dto.getContent() != null ? dto.getContent().trim() : "";
        String cleanContent = Jsoup.clean(rawContent, Safelist.none()).trim();

        if (cleanContent.length() < 5 || cleanContent.length() > 1000) {
            throw new IllegalArgumentException("Nội dung bình luận phải có độ dài từ 5 đến 1000 ký tự!");
        }

        // Lấy thông tin Tên và Email trực tiếp từ User trong DB để đảm bảo độ tin cậy
        String authorName = user.getFullName() != null && !user.getFullName().isBlank() 
                ? user.getFullName() 
                : user.getUsername();
        String authorEmail = user.getEmail() != null ? user.getEmail() : "reader@newsportal.com";

        // Xử lý quan hệ phân cấp (Parent - Child reply)
        Comment parent = null;
        if (dto.getParentId() != null && dto.getParentId() > 0) {
            parent = commentRepository.findById(dto.getParentId()).orElse(null);
            // Đảm bảo comment cha cùng thuộc 1 bài viết
            if (parent != null && !parent.getPost().getId().equals(post.getId())) {
                parent = null;
            }
        }

        // Khởi tạo Comment với user_id và status = APPROVED
        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .userName(authorName)
                .email(authorEmail)
                .content(cleanContent)
                .parent(parent)
                .status("APPROVED")
                .likesCount(0)
                .dislikesCount(0)
                .build();

        Comment saved = commentRepository.save(comment);
        log.info("Saved comment ID: {} by User ID: {} for post ID: {} with status: {}", saved.getId(), user.getId(), post.getId(), saved.getStatus());

        return mapToDTO(saved);
    }

    /**
     * Lấy danh sách bình luận đã duyệt (APPROVED) theo bài viết, hỗ trợ cấu trúc phân cấp cây (Tree node).
     */
    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByPostId(Long postId) {
        List<Comment> approvedComments = commentRepository.findByPostIdApproved(postId);
        log.info("Loaded {} approved comments for post ID: {}", approvedComments.size(), postId);

        // Chuyển đổi sang DTO
        Map<Long, CommentDTO> dtoMap = new HashMap<>();
        List<CommentDTO> rootComments = new ArrayList<>();

        for (Comment c : approvedComments) {
            CommentDTO dto = mapToDTO(c);
            dtoMap.put(dto.getId(), dto);
        }

        // Xây dựng cây phân cấp Parent - Child
        for (Comment c : approvedComments) {
            CommentDTO currentDto = dtoMap.get(c.getId());
            if (c.getParent() != null && dtoMap.containsKey(c.getParent().getId())) {
                CommentDTO parentDto = dtoMap.get(c.getParent().getId());
                parentDto.getReplies().add(currentDto);
            } else {
                rootComments.add(currentDto);
            }
        }

        // Sắp xếp replies theo thời gian tạo tăng dần (câu trả lời sớm nhất xếp trước)
        for (CommentDTO root : rootComments) {
            if (root.getReplies() != null && !root.getReplies().isEmpty()) {
                root.getReplies().sort(Comparator.comparing(CommentDTO::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
            }
        }

        return rootComments;
    }

    private CommentDTO mapToDTO(Comment c) {
        return CommentDTO.builder()
                .id(c.getId())
                .postId(c.getPost() != null ? c.getPost().getId() : null)
                .userName(c.getUserName())
                .email(c.getEmail())
                .content(c.getContent())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .status(c.getStatus())
                .likesCount(c.getLikesCount() != null ? c.getLikesCount() : 0)
                .dislikesCount(c.getDislikesCount() != null ? c.getDislikesCount() : 0)
                .createdAt(c.getCreatedAt())
                .replies(new ArrayList<>())
                .build();
    }
}
