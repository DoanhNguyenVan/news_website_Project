package com.news.newsportal.repository;

import com.news.newsportal.entity.Poll;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {

    @EntityGraph(attributePaths = {"options"})
    List<Poll> findByPostIdAndIsActiveTrue(Long postId);

    @EntityGraph(attributePaths = {"options"})
    Optional<Poll> findFirstByIsActiveTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"options"})
    List<Poll> findAllByOrderByCreatedAtDesc();
}

