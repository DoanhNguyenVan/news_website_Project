package com.news.newsportal.repository;

import com.news.newsportal.entity.ReadingHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, Long> {

    @EntityGraph(attributePaths = {"post", "post.category", "post.author"})
    List<ReadingHistory> findByUserIdOrderByReadAtDesc(Long userId, Pageable pageable);

    @Query("SELECT rh.post.category.id " +
           "FROM ReadingHistory rh " +
           "WHERE rh.user.id = :userId " +
           "GROUP BY rh.post.category.id " +
           "ORDER BY COUNT(rh.id) DESC")
    List<Long> findTopCategoryIdsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT rh.post.id FROM ReadingHistory rh WHERE rh.user.id = :userId")
    List<Long> findReadPostIdsByUserId(@Param("userId") Long userId, Pageable pageable);

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);

    long countByUserId(Long userId);
}

