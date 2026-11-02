package com.news.newsportal.repository;

import com.news.newsportal.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    Optional<Category> findBySlugAndIsDeletedFalse(String slug);
    List<Category> findByParentIsNull();
    List<Category> findByParentIsNullAndIsDeletedFalse();
    List<Category> findByIsDeletedFalse();
    List<Category> findByIsDeletedTrue();
    Boolean existsBySlug(String slug);
    long countByIsDeletedFalse();
    long countByIsDeletedTrue();
}
