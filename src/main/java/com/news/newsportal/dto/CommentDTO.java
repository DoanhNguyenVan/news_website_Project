package com.news.newsportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long id;
    private Long postId;
    private String postTitle;
    private String postSlug;
    private String userName;
    private String email;
    private String content;
    private Long parentId;
    private String status;
    private Integer likesCount;
    private Integer dislikesCount;
    private LocalDateTime createdAt;
    
    @Builder.Default
    private java.util.List<CommentDTO> replies = new java.util.ArrayList<>();
}
