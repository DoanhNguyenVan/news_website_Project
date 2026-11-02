package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.entity.Category;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EDITOR_IN_CHIEF')")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final com.news.newsportal.repository.PostRepository postRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories(
            @RequestParam(required = false, defaultValue = "false") boolean trash) {
        List<Category> categories = trash
                ? categoryRepository.findByIsDeletedTrue()
                : categoryRepository.findByIsDeletedFalse();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> getCategoryById(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Category category) {
        if (category.getSlug() == null || category.getSlug().isBlank()) {
            category.setSlug(category.getName().toLowerCase()
                    .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                    .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                    .replaceAll("[ìíịỉĩ]", "i")
                    .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                    .replaceAll("[ùúụủũưừứựửữ]", "u")
                    .replaceAll("[ỳýỵỷỹ]", "y")
                    .replaceAll("[đ]", "d")
                    .replaceAll("[^a-z0-9]+", "-")
                    .replaceAll("^-|-$", ""));
        }
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success(saved, "Tạo danh mục thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> updateCategory(@PathVariable Long id, @RequestBody Category details) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        category.setName(details.getName());
        if (details.getSlug() != null && !details.getSlug().isBlank()) {
            category.setSlug(details.getSlug());
        }
        category.setDescription(details.getDescription());
        if (details.getParent() != null) {
            category.setParent(details.getParent());
        }

        Category updated = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật danh mục thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + id));
        category.setIsDeleted(true);
        category.setDeletedAt(java.time.LocalDateTime.now());
        categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success("Đã chuyển chuyên mục vào thùng rác"));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<String>> restoreCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + id));
        category.setIsDeleted(false);
        category.setDeletedAt(null);
        categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success("Khôi phục chuyên mục thành công"));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<ApiResponse<String>> hardDeleteCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + id));
        if (postRepository.existsByCategoryId(id)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Không thể xóa vĩnh viễn: Vẫn còn bài viết liên kết với danh mục này!"));
        }
        categoryRepository.delete(category);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa vĩnh viễn chuyên mục khỏi hệ thống"));
    }
}
