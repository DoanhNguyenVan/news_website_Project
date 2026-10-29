package com.news.newsportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private Long id;
    private String title;
    private String slug;
    private String sapo;
    private String content;
    private String thumbnailUrl;
    private String thumbnailCredit;
    private String byline;
    private String postFormat;
    private Integer readingTime;
    private String seriesName;
    private Integer seriesOrder;
    private String audioUrl;
    private String videoUrl;
    private Boolean isSpotlight;
    private Boolean isTrending;
    private Boolean allowComments;
    private Long viewsCount;
    private String status;
    private String rejectionReason;
    private String categoryName;
    private String categorySlug;
    private String authorName;
    private LocalDateTime publishedAt;
    private List<String> tags;
    private List<PostDTO> seriesPosts;
}
