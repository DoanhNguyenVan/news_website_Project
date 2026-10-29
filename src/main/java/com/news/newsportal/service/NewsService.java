package com.news.newsportal.service;

import com.news.newsportal.dto.CommentDTO;
import com.news.newsportal.dto.PostDTO;
import com.news.newsportal.entity.Comment;
import com.news.newsportal.entity.Post;
import com.news.newsportal.entity.PostStatus;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.CommentRepository;
import com.news.newsportal.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final com.news.newsportal.repository.CategoryRepository categoryRepository;
    private final CommentService commentService;

    public List<com.news.newsportal.entity.Category> getPublicCategories() {
        return categoryRepository.findAll();
    }

    /**
     * Trả về dữ liệu trang chủ và cache trong bộ nhớ
     */
    @Cacheable(value = "homepage_news", key = "'homepage'")
    public Map<String, Object> getHomepageNews() {
        Map<String, Object> response = new HashMap<>();

        List<PostDTO> spotlight = postRepository
                .findByStatusAndIsSpotlightTrueOrderByPublishedAtDesc(PostStatus.PUBLISHED, PageRequest.of(0, 3))
                .stream().map(this::convertToDTO).collect(Collectors.toList());

        List<PostDTO> latest = postRepository
                .findByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED, PageRequest.of(0, 10))
                .stream().map(this::convertToDTO).collect(Collectors.toList());

        List<PostDTO> trending = postRepository
                .findByStatusOrderByViewsCountDesc(PostStatus.PUBLISHED, PageRequest.of(0, 5))
                .stream().map(this::convertToDTO).collect(Collectors.toList());

        response.put("spotlight", spotlight);
        response.put("latest", latest);
        response.put("trending", trending);

        return response;
    }

    public Page<PostDTO> getPostsByCategory(String slug, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return postRepository.findByStatusAndCategorySlug(PostStatus.PUBLISHED, slug, pageable)
                .map(this::convertToDTO);
    }

    /**
     * Chi tiết bài viết + Tự động tăng Lượt xem + Nạp danh sách bài viết trong cùng
     * Tuyến bài phóng sự
     */
    @Transactional
    public PostDTO getArticleBySlug(String slug) {
        return getArticleBySlug(slug, true);
    }

    @Transactional
    public PostDTO getArticleBySlug(String slug, boolean incrementView) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại với slug: " + slug));

        if (incrementView) {
            post.setViewsCount(post.getViewsCount() + 1);
            postRepository.save(post);
        }

        PostDTO dto = convertToDTO(post);

        // Nạp danh sách các bài cùng Tuyến bài điều tra / phóng sự nếu có
        if (post.getSeriesName() != null && !post.getSeriesName().isBlank()) {
            List<PostDTO> seriesSiblings = postRepository
                    .findBySeriesNameAndStatusOrderBySeriesOrderAsc(post.getSeriesName(), PostStatus.PUBLISHED)
                    .stream()
                    .map(p -> PostDTO.builder()
                            .id(p.getId())
                            .title(p.getTitle())
                            .slug(p.getSlug())
                            .seriesName(p.getSeriesName())
                            .seriesOrder(p.getSeriesOrder())
                            .readingTime(p.getReadingTime() != null ? p.getReadingTime() : 3)
                            .thumbnailUrl(p.getThumbnailUrl())
                            .publishedAt(p.getPublishedAt())
                            .build())
                    .collect(Collectors.toList());
            dto.setSeriesPosts(seriesSiblings);
        }

        return dto;
    }

    public Page<PostDTO> searchPosts(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return postRepository.searchPosts(query, pageable).map(this::convertToDTO);
    }

    public List<PostDTO> getSearchSuggestions(String query) {
        if (query == null || query.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        Pageable pageable = PageRequest.of(0, 3);
        return postRepository.findSearchSuggestions(query.trim(), pageable)
                .stream()
                .map(this::convertToDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public CommentDTO addComment(CommentDTO dto) {
        return commentService.addComment(dto);
    }

    @Transactional
    public CommentDTO addComment(CommentDTO dto, String username) {
        return commentService.addComment(dto, username);
    }

    public List<CommentDTO> getCommentsByPostId(Long postId) {
        return commentService.getCommentsByPostId(postId);
    }

    public PostDTO convertToDTO(Post post) {
        return PostDTO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .sapo(post.getSapo())
                .content(post.getContent())
                .thumbnailUrl(post.getThumbnailUrl())
                .thumbnailCredit(post.getThumbnailCredit())
                .byline(post.getByline() != null && !post.getByline().isBlank() ? post.getByline()
                        : (post.getAuthor() != null ? post.getAuthor().getFullName() : ""))
                .postFormat(post.getPostFormat() != null ? post.getPostFormat() : "STANDARD")
                .readingTime(post.getReadingTime() != null ? post.getReadingTime() : 3)
                .seriesName(post.getSeriesName())
                .seriesOrder(post.getSeriesOrder())
                .audioUrl(post.getAudioUrl())
                .videoUrl(post.getVideoUrl())
                .isSpotlight(post.getIsSpotlight())
                .isTrending(post.getIsTrending())
                .allowComments(post.getAllowComments())
                .viewsCount(post.getViewsCount())
                .status(post.getStatus().name())
                .categoryName(post.getCategory() != null ? post.getCategory().getName() : "")
                .categorySlug(post.getCategory() != null ? post.getCategory().getSlug() : "")
                .authorName(
                        post.getAuthor() != null
                                ? (post.getAuthor().getFullName() != null ? post.getAuthor().getFullName()
                                        : post.getAuthor().getUsername())
                                : "")
                .publishedAt(post.getPublishedAt())
                .build();
    }
}
