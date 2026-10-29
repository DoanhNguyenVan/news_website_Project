package com.news.newsportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleAuthRequest {
    private String credential;
    private String idToken;

    public String getToken() {
        return (credential != null && !credential.isBlank()) ? credential : idToken;
    }
}

