package com.news.newsportal.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialAuthUrlResponse {
    private String loginType;
    private String authorizationUrl;
}

