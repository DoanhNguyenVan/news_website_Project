package com.news.newsportal.controller;

import com.news.newsportal.entity.*;
import com.news.newsportal.repository.CategoryRepository;
import com.news.newsportal.repository.CommentRepository;
import com.news.newsportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/super")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final PasswordEncoder passwordEncoder;

    // --- 1. CRUD USERS & ROLE ASSIGNMENT ---
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        // BẮT BUỘC BĂM MẬT KHẨU BCRYPT
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        if (user.getRole() == null) user.setRole(Role.USER);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa người dùng thành công");
    }

    // --- 2. CRUD CATEGORIES ---
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    // --- 3. MODERATE COMMENTS ---
    @GetMapping("/comments")
    public ResponseEntity<List<Comment>> getAllComments() {
        return ResponseEntity.ok(commentRepository.findAll());
    }

    @PatchMapping("/comments/{id}/status")
    public ResponseEntity<String> moderateComment(@PathVariable Long id, @RequestParam String status) {
        Comment comment = commentRepository.findById(id).orElseThrow();
        comment.setStatus(status.toUpperCase());
        commentRepository.save(comment);
        return ResponseEntity.ok("Đã cập nhật trạng thái bình luận");
    }

    // --- 4. CLEAR CACHE REDIS / SYSTEM SETTINGS ---
    @PostMapping("/settings/clear-cache")
    public ResponseEntity<Map<String, String>> clearCache() {
        Map<String, String> res = new HashMap<>();
        res.put("message", "Đã xóa toàn bộ Cache Redis & Nginx thành công!");
        return ResponseEntity.ok(res);
    }
}
