package com.news.newsportal.repository;

import com.news.newsportal.entity.Advertisement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AdvertisementRepository extends JpaRepository<Advertisement, Long> {

    List<Advertisement> findByIsActiveTrueOrderByCreatedAtDesc();

    List<Advertisement> findByPositionAndIsActiveTrueOrderByCreatedAtDesc(String position);

    List<Advertisement> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Transactional
    @Query("UPDATE Advertisement a SET a.clickCount = a.clickCount + 1 WHERE a.id = :id")
    void incrementClickCount(@Param("id") Long id);
}
