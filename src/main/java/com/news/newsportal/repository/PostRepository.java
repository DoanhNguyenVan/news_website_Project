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
    List<Post> findByStatusAndIsSpotlightTrueOrderByPublishedAtDesc(PostStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusOrderByPublishedAtDesc(PostStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findByStatusOrderByViewsCountDesc(PostStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByStatusAndCategorySlug(PostStatus status, String categorySlug, Pageable pageable);
    
    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByStatus(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.sapo) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Post> searchPosts(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.sapo) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY p.publishedAt DESC")
    List<Post> findSearchSuggestions(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByAuthorId(Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    Page<Post> findByAuthorIdAndStatus(Long authorId, PostStatus status, Pageable pageable);

    boolean existsByCategoryId(Long categoryId);

    long countByStatus(PostStatus status);

    @Query("SELECT COALESCE(SUM(p.viewsCount), 0) FROM Post p")
    long sumTotalViews();

    @EntityGraph(attributePaths = {"category", "author"})
    List<Post> findBySeriesNameAndStatusOrderBySeriesOrderAsc(String seriesName, PostStatus status);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' " +
           "AND (:categoryIds IS NULL OR p.category.id IN :categoryIds) " +
           "AND (:excludeIds IS NULL OR p.id NOT IN :excludeIds) " +
           "ORDER BY p.publishedAt DESC")
    List<Post> findForYouByCategory(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("excludeIds") List<Long> excludeIds,
            Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p JOIN p.tags t " +
           "WHERE p.status = 'PUBLISHED' AND p.id != :currentPostId AND t.id IN :tagIds " +
           "GROUP BY p.id " +
           "ORDER BY COUNT(t.id) DESC, p.publishedAt DESC")
    List<Post> findSmartRelatedByTags(
            @Param("currentPostId") Long currentPostId,
            @Param("tagIds") java.util.Collection<Long> tagIds,
            Pageable pageable);

    @EntityGraph(attributePaths = {"category", "author"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND p.id != :currentPostId AND p.category.id = :categoryId " +
           "ORDER BY p.viewsCount DESC, p.publishedAt DESC")
    List<Post> findRelatedByCategoryFallback(
            @Param("currentPostId") Long currentPostId,
            @Param("categoryId") Long categoryId,
            Pageable pageable);
}
