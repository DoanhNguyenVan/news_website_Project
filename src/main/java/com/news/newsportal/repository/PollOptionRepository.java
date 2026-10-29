package com.news.newsportal.repository;

import com.news.newsportal.entity.PollOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PollOptionRepository extends JpaRepository<PollOption, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE PollOption po SET po.votesCount = po.votesCount + 1 WHERE po.id = :id")
    void incrementVotesCount(@Param("id") Long id);
}

