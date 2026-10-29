package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.entity.Advertisement;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.AdvertisementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/admin/advertisements", "/api/admin/advertisements"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EDITOR_IN_CHIEF')")
public class AdminAdvertisementController {

    private final AdvertisementRepository advertisementRepository;

    /**
     * Lấy toàn bộ danh sách quảng cáo/banner để Admin quản lý
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Advertisement>>> getAllAdvertisements() {
        return ResponseEntity.ok(ApiResponse.success(advertisementRepository.findAllByOrderByCreatedAtDesc()));
    }

    /**
     * Thêm mới banner quảng cáo
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Advertisement>> createAdvertisement(@RequestBody Advertisement ad) {
        if (ad.getTitle() == null || ad.getTitle().isBlank()) {
            throw new IllegalArgumentException("Tên chiến dịch quảng cáo không được để trống!");
        }
        if (ad.getImageUrl() == null || ad.getImageUrl().isBlank()) {
            throw new IllegalArgumentException("Đường dẫn ảnh banner không được để trống!");
        }
        if (ad.getPosition() == null || ad.getPosition().isBlank()) {
            ad.setPosition("HOME_TOP");
        }
        if (ad.getIsActive() == null) {
            ad.setIsActive(true);
        }
        if (ad.getClickCount() == null) {
            ad.setClickCount(0L);
        }

        Advertisement saved = advertisementRepository.save(ad);
        return ResponseEntity.ok(ApiResponse.success(saved, "Tạo banner quảng cáo thành công"));
    }

    /**
     * Cập nhật thông tin banner quảng cáo
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Advertisement>> updateAdvertisement(
            @PathVariable Long id,
            @RequestBody Advertisement details) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner quảng cáo với ID: " + id));

        ad.setTitle(details.getTitle());
        ad.setImageUrl(details.getImageUrl());
        ad.setTargetUrl(details.getTargetUrl());
        ad.setPosition(details.getPosition());
        if (details.getIsActive() != null) {
            ad.setIsActive(details.getIsActive());
        }
        ad.setStartDate(details.getStartDate());
        ad.setEndDate(details.getEndDate());

        Advertisement updated = advertisementRepository.save(ad);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật banner quảng cáo thành công"));
    }

    /**
     * BẬT / TẮT hiển thị quảng cáo ngay lập tức (Toggle Active)
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Boolean>> toggleAdvertisementStatus(@PathVariable Long id) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner quảng cáo với ID: " + id));

        boolean newStatus = !Boolean.TRUE.equals(ad.getIsActive());
        ad.setIsActive(newStatus);
        advertisementRepository.save(ad);

        String message = newStatus ? "Đã BẬT hiển thị banner quảng cáo thành công" : "Đã TẮT (ẨN) banner quảng cáo thành công";
        return ResponseEntity.ok(ApiResponse.success(newStatus, message));
    }

    /**
     * Xóa banner quảng cáo
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAdvertisement(@PathVariable Long id) {
        if (!advertisementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy banner quảng cáo với ID: " + id);
        }
        advertisementRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa banner quảng cáo thành công"));
    }
}
