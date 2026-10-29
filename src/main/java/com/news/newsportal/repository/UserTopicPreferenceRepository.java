package com.news.newsportal.repository;

import com.news.newsportal.entity.UserTopicPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTopicPreferenceRepository extends JpaRepository<UserTopicPreference, Long> {

    List<UserTopicPreference> findByUserId(Long userId);

    @Query("SELECT utp.category.id FROM UserTopicPreference utp WHERE utp.user.id = :userId")
    List<Long> findCategoryIdsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM UserTopicPreference utp WHERE utp.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    long countByUserId(Long userId);
}

