package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.entity.Advertisement;
import com.news.newsportal.repository.AdvertisementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/public/advertisements", "/api/v1/news/advertisements"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PublicAdvertisementController {

    private final AdvertisementRepository advertisementRepository;

    /**
     * Lấy toàn bộ danh sách quảng cáo đang BẬT (isActive = true), gom nhóm theo từng vị trí (position)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<Advertisement>>>> getActiveAdvertisements() {
        List<Advertisement> activeAds = advertisementRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        Map<String, List<Advertisement>> grouped = new HashMap<>();

        for (Advertisement ad : activeAds) {
            grouped.computeIfAbsent(ad.getPosition(), k -> new java.util.ArrayList<>()).add(ad);
        }

        return ResponseEntity.ok(ApiResponse.success(grouped));
    }

    /**
     * Lấy danh sách quảng cáo đang BẬT theo vị trí cụ thể (ví dụ: HOME_TOP, HOME_SIDEBAR, ARTICLE_SIDEBAR)
     */
    @GetMapping("/position/{position}")
    public ResponseEntity<ApiResponse<List<Advertisement>>> getAdsByPosition(@PathVariable String position) {
        List<Advertisement> ads = advertisementRepository.findByPositionAndIsActiveTrueOrderByCreatedAtDesc(position.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(ads));
    }

    /**
     * Ghi nhận lượt nhấp (Click tracking) khi độc giả bấm vào banner quảng cáo
     */
    @PostMapping("/{id}/click")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trackClick(@PathVariable Long id) {
        advertisementRepository.incrementClickCount(id);
        Advertisement ad = advertisementRepository.findById(id).orElse(null);

        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("targetUrl", ad != null ? ad.getTargetUrl() : "#");

        return ResponseEntity.ok(ApiResponse.success(result, "Click tracked"));
    }
}
