package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.PostDTO;
import com.news.newsportal.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/public/posts", "/api/posts"})
@RequiredArgsConstructor
public class PublicPostController {

    private final NewsService newsService;

    @GetMapping("/search-suggestions")
    public ResponseEntity<ApiResponse<List<PostDTO>>> getSearchSuggestions(
            @RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(ApiResponse.success(newsService.getSearchSuggestions(q)));
    }
}
