package com.news.newsportal.repository;

import com.news.newsportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameAndIsDeletedFalse(String username);
    Optional<User> findByEmailAndIsDeletedFalse(String email);
    Optional<User> findByGoogleAccountId(String googleAccountId);
    Optional<User> findByFacebookAccountId(String facebookAccountId);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    org.springframework.data.domain.Page<User> findByIsDeletedFalse(org.springframework.data.domain.Pageable pageable);
    long countByIsDeletedFalse();
}
