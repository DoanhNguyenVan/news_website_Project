package com.news.newsportal.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.file.Path;

@Service
@Slf4j
public class WebpConversionService {

    /**
     * Chuyển đổi WebP bằng native library đã được tắt để ngăn ngừa lỗi SIGSEGV trên hệ điều hành Linux (Render).
     * Tất cả các tác vụ tối ưu hóa hình ảnh hiện được Cloudinary xử lý tự động qua CDN.
     */
    public boolean convertToWebp(InputStream inputStream, Path targetFile) {
        log.debug("Native WebP conversion is bypassed to prevent native library crashes.");
        return false;
    }
}
