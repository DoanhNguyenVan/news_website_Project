package com.news.newsportal.repository;

import com.news.newsportal.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND (c.status = 'APPROVED' OR c.status IS NULL) ORDER BY c.createdAt DESC")
    List<Comment> findByPostIdApproved(@org.springframework.data.repository.query.Param("postId") Long postId);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Comment> findByPostIdAndStatusOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("postId") Long postId, @org.springframework.data.repository.query.Param("status") String status);

    List<Comment> findByStatusOrderByCreatedAtDesc(String status);

    List<Comment> findAllByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c LEFT JOIN FETCH c.post ORDER BY c.createdAt DESC")
    List<Comment> findAllWithPostOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c LEFT JOIN FETCH c.post WHERE c.status = :status ORDER BY c.createdAt DESC")
    List<Comment> findByStatusWithPostOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("status") String status);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c LEFT JOIN FETCH c.post WHERE c.status IN ('HIDDEN', 'REJECTED', 'SPAM') ORDER BY c.createdAt DESC")
    List<Comment> findHiddenWithPostOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c WHERE c.post.id = :postId ORDER BY c.createdAt DESC")
    List<Comment> findByPostIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("postId") Long postId);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c WHERE c.post.id = :postId")
    List<Comment> findByPostId(@org.springframework.data.repository.query.Param("postId") Long postId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM Comment c WHERE c.post.id = :postId")
    void deleteByPostId(@org.springframework.data.repository.query.Param("postId") Long postId);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c WHERE c.user.id = :userId ORDER BY c.createdAt DESC")
    List<Comment> findByUserIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("userId") Long userId);

    long countByUserId(Long userId);

    long countByStatus(String status);
}
