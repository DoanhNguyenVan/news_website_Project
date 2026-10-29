package com.news.newsportal.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        if (cloudName == null || cloudName.isBlank() ||
            apiKey == null || apiKey.isBlank() ||
            apiSecret == null || apiSecret.isBlank()) {
            log.warn("Cloudinary chưa được cấu hình đầy đủ. Hệ thống sẽ lưu trữ ảnh tại thư mục cục bộ (/uploads/).");
            return null;
        }
        log.info("Khởi tạo Cloudinary thành công với Cloud Name: {}", cloudName);
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName.trim(),
                "api_key", apiKey.trim(),
                "api_secret", apiSecret.trim(),
                "secure", true
        ));
    }
}

