package com.news.newsportal.repository;

import com.news.newsportal.entity.Post;
import com.news.newsportal.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Override
    @EntityGraph(attributePaths = {"category", "author"})
    Optional<Post> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Optional<Post> findBySlug(String slug);

    @EntityGraph(attributePaths = {"category", "author"})
    Optional<Post> findBySlugAndIsDeletedFalse(String slug);
    
    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusAndIsSpotlightTrueOrderByPublishedAtDesc(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusAndIsSpotlightTrueAndIsDeletedFalseOrderByPublishedAtDesc(PostStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusAndIsTrendingTrueOrderByPublishedAtDesc(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusAndIsTrendingTrueAndIsDeletedFalseOrderByPublishedAtDesc(PostStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusOrderByPublishedAtDesc(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusAndIsDeletedFalseOrderByPublishedAtDesc(PostStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusOrderByViewsCountDesc(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusAndIsDeletedFalseOrderByViewsCountDesc(PostStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByStatusAndCategorySlug(PostStatus status, String categorySlug, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByStatusAndCategorySlugAndIsDeletedFalse(PostStatus status, String categorySlug, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByStatus(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByStatusAndIsDeletedFalse(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByIsDeletedFalse(Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByIsDeletedTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND p.isDeleted = false AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.sapo) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Post> searchPosts(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND p.isDeleted = false AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.sapo) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY p.publishedAt DESC")
    List<Post> findSearchSuggestions(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByAuthorId(Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByAuthorIdAndIsDeletedFalse(Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByAuthorIdAndIsDeletedTrue(Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByAuthorIdAndStatus(Long authorId, PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByAuthorIdAndStatusAndIsDeletedFalse(Long authorId, PostStatus status, Pageable pageable);

    boolean existsByCategoryId(Long categoryId);

    long countByStatus(PostStatus status);

    long countByIsDeletedFalse();

    long countByIsDeletedTrue();

    long countByStatusAndIsDeletedFalse(PostStatus status);

    @Query("SELECT COALESCE(SUM(p.viewsCount), 0) FROM Post p WHERE p.isDeleted = false")
    long sumTotalViews();

    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findBySeriesNameAndStatusOrderBySeriesOrderAsc(String seriesName, PostStatus status);

    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findBySeriesNameAndStatusAndIsDeletedFalseOrderBySeriesOrderAsc(String seriesName, PostStatus status);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND p.isDeleted = false " +
           "AND (:categoryIds IS NULL OR p.category.id IN :categoryIds) " +
           "AND (:excludeIds IS NULL OR p.id NOT IN :excludeIds) " +
           "ORDER BY p.publishedAt DESC")
    List<Post> findForYouByCategory(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("excludeIds") List<Long> excludeIds,
            Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p JOIN p.tags t " +
           "WHERE p.status = 'PUBLISHED' AND p.isDeleted = false AND p.id != :currentPostId AND t.id IN :tagIds " +
           "GROUP BY p.id " +
           "ORDER BY COUNT(t.id) DESC, p.publishedAt DESC")
    List<Post> findSmartRelatedByTags(
            @Param("currentPostId") Long currentPostId,
            @Param("tagIds") java.util.Collection<Long> tagIds,
            Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND p.isDeleted = false AND p.id != :currentPostId AND p.category.id = :categoryId " +
           "ORDER BY p.viewsCount DESC, p.publishedAt DESC")
    List<Post> findRelatedByCategoryFallback(
            @Param("currentPostId") Long currentPostId,
            @Param("categoryId") Long categoryId,
            Pageable pageable);
}
