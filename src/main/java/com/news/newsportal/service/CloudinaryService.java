package com.news.newsportal.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    @Autowired(required = false)
    private Cloudinary cloudinary;

    public boolean isConfigured() {
        return cloudinary != null;
    }

    /**
     * Tải file ảnh lên Cloudinary vào thư mục 'newsportal'
     * @param file file ảnh vật lý trên đĩa
     * @param publicIdPrefix tiền tố tên file trên cloud
     * @return secure_url (URL HTTPS của ảnh trên Cloudinary) hoặc null nếu lỗi
     */
    public String uploadImage(File file, String publicIdPrefix) {
        if (cloudinary == null) {
            return null;
        }
        try {
            Map uploadParams = ObjectUtils.asMap(
                    "folder", "newsportal",
                    "resource_type", "image",
                    "use_filename", true,
                    "unique_filename", true
            );
            Map uploadResult = cloudinary.uploader().upload(file, uploadParams);
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Tải ảnh lên Cloudinary thành công: {}", secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.error("Lỗi khi tải ảnh lên Cloudinary: {}", e.getMessage(), e);
            return null;
        }
    }
}

