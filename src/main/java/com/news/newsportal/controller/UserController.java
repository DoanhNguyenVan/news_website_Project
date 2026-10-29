package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.UserDTO;
import com.news.newsportal.entity.Role;
import com.news.newsportal.entity.User;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> dtos = userRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        return ResponseEntity.ok(ApiResponse.success(mapToDTO(user)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@RequestBody User user) {
        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        } else {
            user.setPasswordHash(passwordEncoder.encode("123456"));
        }
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }
        if (user.getStatus() == null) {
            user.setStatus("ACTIVE");
        }
        if (user.getAuthProvider() == null) {
            user.setAuthProvider("LOCAL");
        }
        user.setIsEmailVerified(true);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(mapToDTO(saved), "Tạo tài khoản người dùng thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        user.setFullName(userDetails.getFullName());
        user.setEmail(userDetails.getEmail());
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        if (userDetails.getStatus() != null) {
            user.setStatus(userDetails.getStatus());
        }

        if (userDetails.getPasswordHash() != null && !userDetails.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(userDetails.getPasswordHash()));
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(mapToDTO(updated), "Cập nhật tài khoản thành công"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> toggleUserStatus(@PathVariable Long id, @RequestParam String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if ("admin".equals(user.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể khóa tài khoản Quản trị viên tối cao (admin)!"));
        }
        user.setStatus(status.toUpperCase());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Đã đổi trạng thái tài khoản thành " + status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if ("admin".equals(user.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể xóa tài khoản Quản trị viên tối cao (admin)!"));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa người dùng thành công"));
    }

    private UserDTO mapToDTO(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .avatarUrl(u.getAvatarUrl())
                .role(u.getRole() != null ? u.getRole().name() : "USER")
                .status(u.getStatus())
                .authProvider(u.getAuthProvider())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
