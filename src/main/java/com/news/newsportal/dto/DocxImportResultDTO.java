package com.news.newsportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocxImportResultDTO {
    private String title;
    private String sapo;
    private String htmlContent;
    private List<String> extractedImages;
}
