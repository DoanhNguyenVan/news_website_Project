package com.news.newsportal.service;

import com.news.newsportal.dto.PostDTO;
import com.news.newsportal.entity.*;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.CategoryRepository;
import com.news.newsportal.repository.CommentRepository;
import com.news.newsportal.repository.PostRepository;
import com.news.newsportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminPostService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPosts", postRepository.count());
        stats.put("pendingPosts", postRepository.countByStatus(PostStatus.PENDING_APPROVAL));
        stats.put("publishedPosts", postRepository.countByStatus(PostStatus.PUBLISHED));
        stats.put("totalViews", postRepository.sumTotalViews());
        stats.put("totalUsers", userRepository.count());
        stats.put("totalCategories", categoryRepository.count());
        stats.put("totalComments", commentRepository.count());
        stats.put("pendingComments", commentRepository.countByStatus("PENDING"));
        return stats;
    }

    @Transactional
    @CacheEvict(value = "homepage_news", allEntries = true)
    public PostDTO createPost(PostDTO dto, String username) {
        User author = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Tác giả không tồn tại")));

        Category category = null;
        if (dto.getCategorySlug() != null && !dto.getCategorySlug().isBlank()) {
            category = categoryRepository.findBySlug(dto.getCategorySlug()).orElse(null);
        }
        if (category == null) {
            category = categoryRepository.findAll().stream().findFirst()
                    .orElseGet(() -> categoryRepository.save(Category.builder().name("Thời sự").slug("thoi-su").description("Chuyên mục mặc định").build()));
        }

        String slug = dto.getSlug() != null && !dto.getSlug().isBlank() ? dto.getSlug() :
                generateSlug(dto.getTitle());

        String cleanContent = sanitizeHtml(dto.getContent());

        // RBAC: Ngoài SUPER_ADMIN ra thì các role khác ko có quyền đăng bài luôn, chỉ dc đăng ở trạng thái chờ duyệt
        PostStatus targetStatus = PostStatus.DRAFT;
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            PostStatus requested = PostStatus.valueOf(dto.getStatus().toUpperCase());
            if (author.getRole() != Role.SUPER_ADMIN && requested == PostStatus.PUBLISHED) {
                targetStatus = PostStatus.PENDING_APPROVAL; // Chuyển bắt buộc thành gửi duyệt
            } else {
                targetStatus = requested;
            }
        }

        // RBAC: AUTHOR không được ghim Spotlight / Trending
        boolean isSpotlight = Boolean.TRUE.equals(dto.getIsSpotlight()) && author.isAtLeastEditor();
        boolean isTrending = Boolean.TRUE.equals(dto.getIsTrending()) && author.isAtLeastEditor();

        int readingTime = dto.getReadingTime() != null && dto.getReadingTime() > 0 ? dto.getReadingTime() : calculateReadingTime(cleanContent);
        String byline = dto.getByline() != null && !dto.getByline().isBlank() ? dto.getByline().trim() : (author.getFullName() != null ? author.getFullName() : author.getUsername());

        Post post = Post.builder()
                .title(dto.getTitle())
                .slug(slug)
                .sapo(dto.getSapo())
                .content(cleanContent)
                .thumbnailUrl(dto.getThumbnailUrl())
                .thumbnailCredit(dto.getThumbnailCredit())
                .byline(byline)
                .postFormat(dto.getPostFormat() != null && !dto.getPostFormat().isBlank() ? dto.getPostFormat().toUpperCase() : "STANDARD")
                .readingTime(readingTime)
                .seriesName(dto.getSeriesName())
                .seriesOrder(dto.getSeriesOrder())
                .audioUrl(dto.getAudioUrl())
                .videoUrl(dto.getVideoUrl())
                .isSpotlight(isSpotlight)
                .isTrending(isTrending)
                .allowComments(dto.getAllowComments() != null ? dto.getAllowComments() : true)
                .viewsCount(0L)
                .status(targetStatus)
                .author(author)
                .category(category)
                .publishedAt(targetStatus == PostStatus.PUBLISHED ? LocalDateTime.now() : null)
                .build();

        Post saved = postRepository.save(post);
        dto.setId(saved.getId());
        dto.setSlug(saved.getSlug());
        dto.setStatus(saved.getStatus().name());
        return dto;
    }

    @Transactional(readOnly = true)
    public Page<PostDTO> getAdminPosts(String status, int page, int size, String username) {
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
        User currentUser = username != null ? userRepository.findByUsername(username).orElse(null) : null;
        
        Page<Post> posts;
        
        // Data Scoping: Nếu là AUTHOR thì chỉ lấy các bài viết của chính mình
        if (currentUser != null && currentUser.getRole() == Role.AUTHOR) {
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                posts = postRepository.findByAuthorIdAndStatus(currentUser.getId(), PostStatus.valueOf(status.toUpperCase()), pageable);
            } else {
                posts = postRepository.findByAuthorId(currentUser.getId(), pageable);
            }
        } else {
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                posts = postRepository.findByStatus(PostStatus.valueOf(status.toUpperCase()), pageable);
            } else {
                posts = postRepository.findAll(pageable);
            }
        }

        return posts.map(p -> PostDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .slug(p.getSlug())
                .sapo(p.getSapo())
                .thumbnailUrl(p.getThumbnailUrl())
                .thumbnailCredit(p.getThumbnailCredit())
                .byline(p.getByline())
                .postFormat(p.getPostFormat())
                .readingTime(p.getReadingTime())
                .seriesName(p.getSeriesName())
                .seriesOrder(p.getSeriesOrder())
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : "")
                .categorySlug(p.getCategory() != null ? p.getCategory().getSlug() : "")
                .authorName(p.getAuthor() != null ? (p.getAuthor().getFullName() != null ? p.getAuthor().getFullName() : p.getAuthor().getUsername()) : "")
                .status(p.getStatus().name())
                .rejectionReason(p.getRejectionReason())
                .isSpotlight(p.getIsSpotlight())
                .isTrending(p.getIsTrending())
                .allowComments(p.getAllowComments())
                .viewsCount(p.getViewsCount())
                .publishedAt(p.getPublishedAt())
                .build());
    }

    /**
     * Cập nhật trạng thái bài viết (Duyệt, Từ chối, Xuất bản)
     */
    @Transactional
    @CacheEvict(value = "homepage_news", allEntries = true)
    public void updatePostStatus(Long id, String status, String rejectionReason, String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        PostStatus newStatus = PostStatus.valueOf(status.toUpperCase());

        if (newStatus == PostStatus.PUBLISHED && !(currentUser.isSuperAdmin() || currentUser.isEditorInChief())) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ Quản trị viên hoặc Tổng biên tập mới có quyền duyệt và xuất bản bài viết!");
        }

        if (!currentUser.isAtLeastEditor()) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền thay đổi trạng thái bài viết!");
        }

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại"));

        post.setStatus(newStatus);

        if (newStatus == PostStatus.REJECTED) {
            post.setRejectionReason(rejectionReason);
        } else if (newStatus == PostStatus.PUBLISHED) {
            post.setPublishedAt(LocalDateTime.now());
            post.setRejectionReason(null);
        }

        postRepository.save(post);
    }

    @Transactional(readOnly = true)
    public PostDTO getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại với ID: " + id));

        return PostDTO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .sapo(post.getSapo())
                .content(post.getContent())
                .thumbnailUrl(post.getThumbnailUrl())
                .thumbnailCredit(post.getThumbnailCredit())
                .byline(post.getByline())
                .postFormat(post.getPostFormat())
                .readingTime(post.getReadingTime())
                .seriesName(post.getSeriesName())
                .seriesOrder(post.getSeriesOrder())
                .audioUrl(post.getAudioUrl())
                .videoUrl(post.getVideoUrl())
                .isSpotlight(post.getIsSpotlight())
                .isTrending(post.getIsTrending())
                .allowComments(post.getAllowComments())
                .status(post.getStatus().name())
                .rejectionReason(post.getRejectionReason())
                .viewsCount(post.getViewsCount())
                .categoryName(post.getCategory() != null ? post.getCategory().getName() : "")
                .categorySlug(post.getCategory() != null ? post.getCategory().getSlug() : "")
                .authorName(post.getAuthor() != null ? (post.getAuthor().getFullName() != null ? post.getAuthor().getFullName() : post.getAuthor().getUsername()) : "")
                .publishedAt(post.getPublishedAt())
                .build();
    }

    @Transactional
    @CacheEvict(value = "homepage_news", allEntries = true)
    public PostDTO updatePost(Long id, PostDTO dto, String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại với ID: " + id));

        // Ownership Validation: Nếu là AUTHOR, bắt buộc bài viết phải do chính mình tạo ra
        if (currentUser.getRole() == Role.AUTHOR) {
            if (post.getAuthor() == null || !post.getAuthor().getId().equals(currentUser.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền chỉnh sửa bài viết của tác giả khác!");
            }
        }

        // RBAC: Chỉ SUPER_ADMIN và EDITOR_IN_CHIEF mới được duyệt trực tiếp lên PUBLISHED
        if (!currentUser.isSuperAdmin() && !currentUser.isEditorInChief()) {
            if (dto.getStatus() != null && "PUBLISHED".equalsIgnoreCase(dto.getStatus())) {
                dto.setStatus("PENDING_APPROVAL");
            }
        }

        post.setTitle(dto.getTitle());
        if (dto.getSlug() != null && !dto.getSlug().isBlank()) {
            post.setSlug(dto.getSlug());
        }
        post.setSapo(dto.getSapo());
        if (dto.getContent() != null) {
            post.setContent(sanitizeHtml(dto.getContent()));
            if (dto.getReadingTime() == null || dto.getReadingTime() <= 0) {
                post.setReadingTime(calculateReadingTime(post.getContent()));
            }
        }
        if (dto.getReadingTime() != null && dto.getReadingTime() > 0) {
            post.setReadingTime(dto.getReadingTime());
        }
        if (dto.getThumbnailUrl() != null) {
            post.setThumbnailUrl(dto.getThumbnailUrl());
        }
        if (dto.getThumbnailCredit() != null) {
            post.setThumbnailCredit(dto.getThumbnailCredit());
        }
        if (dto.getByline() != null) {
            post.setByline(dto.getByline());
        }
        if (dto.getPostFormat() != null) {
            post.setPostFormat(dto.getPostFormat().toUpperCase());
        }
        if (dto.getSeriesName() != null) {
            post.setSeriesName(dto.getSeriesName().isBlank() ? null : dto.getSeriesName().trim());
        }
        if (dto.getSeriesOrder() != null) {
            post.setSeriesOrder(dto.getSeriesOrder());
        }

        post.setAudioUrl(dto.getAudioUrl());
        post.setVideoUrl(dto.getVideoUrl());

        if (currentUser.isAtLeastEditor()) {
            if (dto.getIsSpotlight() != null) post.setIsSpotlight(dto.getIsSpotlight());
            if (dto.getIsTrending() != null) post.setIsTrending(dto.getIsTrending());
        }

        if (dto.getAllowComments() != null) {
            post.setAllowComments(dto.getAllowComments());
        }

        if (dto.getCategorySlug() != null && !dto.getCategorySlug().isBlank()) {
            categoryRepository.findBySlug(dto.getCategorySlug()).ifPresent(post::setCategory);
        }

        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            PostStatus newStatus = PostStatus.valueOf(dto.getStatus().toUpperCase());
            if (!currentUser.isSuperAdmin() && !currentUser.isEditorInChief() && newStatus == PostStatus.PUBLISHED) {
                newStatus = PostStatus.PENDING_APPROVAL;
            }
            post.setStatus(newStatus);
            if (newStatus == PostStatus.PUBLISHED && post.getPublishedAt() == null) {
                post.setPublishedAt(LocalDateTime.now());
            }
        }

        Post saved = postRepository.save(post);
        return getPostById(saved.getId());
    }

    private int calculateReadingTime(String content) {
        if (content == null || content.isBlank()) return 2;
        String text = Jsoup.parse(content).text();
        int words = text.split("\\s+").length;
        return Math.max(1, (int) Math.ceil(words / 200.0));
    }

    @Transactional
    @CacheEvict(value = "homepage_news", allEntries = true)
    public void deletePost(Long id, String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại với ID: " + id));

        // Ownership Validation: Nếu là AUTHOR, bắt buộc bài viết phải do chính mình tạo ra
        if (currentUser.getRole() == Role.AUTHOR) {
            if (post.getAuthor() == null || !post.getAuthor().getId().equals(currentUser.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền xóa bài viết của tác giả khác!");
            }
        }

        // Xóa bình luận liên quan trước để tránh khóa ngoại MySQL
        commentRepository.deleteByPostId(id);
        postRepository.deleteById(id);
    }

    @Transactional
    @CacheEvict(value = "homepage_news", allEntries = true)
    public boolean toggleSpotlight(Long id, String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        if (!currentUser.isAtLeastEditor()) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ Ban biên tập mới có quyền ghim bài viết Spotlight!");
        }

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại với ID: " + id));
        boolean newVal = !Boolean.TRUE.equals(post.getIsSpotlight());
        post.setIsSpotlight(newVal);
        postRepository.save(post);
        return newVal;
    }

    @Transactional
    @CacheEvict(value = "homepage_news", allEntries = true)
    public boolean toggleTrending(Long id, String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        if (!currentUser.isAtLeastEditor()) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ Ban biên tập mới có quyền ghim bài viết Xu hướng!");
        }

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại với ID: " + id));
        boolean newVal = !Boolean.TRUE.equals(post.getIsTrending());
        post.setIsTrending(newVal);
        postRepository.save(post);
        return newVal;
    }

    private String sanitizeHtml(String html) {
        if (html == null || html.isBlank()) return "";
        org.jsoup.safety.Safelist safelist = org.jsoup.safety.Safelist.relaxed()
                .preserveRelativeLinks(true)
                .addProtocols("img", "src", "http", "https", "data")
                .addTags("figure", "figcaption", "video", "source", "audio", "iframe", "span", "div", "hr", "mark")
                .addAttributes(":all", "class", "style", "id", "data-width", "data-height", "title", "alt")
                .addAttributes("img", "src", "alt", "title", "class", "style", "width", "height", "loading")
                .addAttributes("iframe", "src", "width", "height", "frameborder", "allowfullscreen")
                .addAttributes("video", "controls", "src", "width", "height", "poster")
                .addAttributes("audio", "controls", "src");
        String cleaned = org.jsoup.Jsoup.clean(html, "http://localhost", safelist);
        org.jsoup.nodes.Document doc = org.jsoup.Jsoup.parse(cleaned);
        doc.select("[contenteditable]").removeAttr("contenteditable");
        doc.select(".active-selected-img").removeClass("active-selected-img");
        return doc.body().html();
    }

    private String generateSlug(String input) {
        if (input == null || input.isBlank()) return "post-" + UUID.randomUUID().toString().substring(0, 5);
        String temp = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String normalized = pattern.matcher(temp).replaceAll("").replace('đ', 'd').replace('Đ', 'D');
        String slug = normalized.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        return slug.isEmpty() ? "post-" + UUID.randomUUID().toString().substring(0, 5) : slug + "-" + UUID.randomUUID().toString().substring(0, 5);
    }
}
