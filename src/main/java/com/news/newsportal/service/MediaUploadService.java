package com.news.newsportal.service;

import com.news.newsportal.entity.Media;
import com.news.newsportal.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaUploadService {

    private final MediaRepository mediaRepository;
    private final WebpConversionService webpConversionService;
    private final CloudinaryService cloudinaryService;

    private Path getUploadDir() throws IOException {
        String userHome = System.getProperty("user.home");
        Path uploadDir = Paths.get(userHome, "uploads");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
        return uploadDir;
    }

    public String uploadMedia(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Tập tin tải lên không được để trống");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new IllegalArgumentException("Chỉ cho phép tải lên định dạng hình ảnh hoặc video");
        }

        Path uploadDir = getUploadDir();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String uuid = UUID.randomUUID().toString();
        String finalFileName;
        String finalContentType = contentType;
        long finalFileSize;

        // Nếu là tệp hình ảnh (jpg, jpeg, png, bmp...) -> Tự động chuyển đổi sang WebP siêu nhẹ
        if (contentType.startsWith("image/") && !contentType.contains("svg") && !contentType.contains("gif")) {
            finalFileName = uuid + ".webp";
            Path webpFilePath = uploadDir.resolve(finalFileName);

            boolean converted = webpConversionService.convertToWebp(file.getInputStream(), webpFilePath);
            if (converted && Files.exists(webpFilePath)) {
                finalContentType = "image/webp";
                finalFileSize = Files.size(webpFilePath);
                log.info("Ảnh đã được nén thành công sang WebP: {}", finalFileName);
            } else {
                // Fallback nếu chuyển đổi lỗi: Lưu nguyên bản định dạng gốc
                finalFileName = uuid + "_" + originalFilename;
                Path originalFilePath = uploadDir.resolve(finalFileName);
                Files.copy(file.getInputStream(), originalFilePath, StandardCopyOption.REPLACE_EXISTING);
                finalFileSize = Files.size(originalFilePath);
            }
        } else {
            // Video hoặc ảnh động GIF/SVG: Lưu trực tiếp
            finalFileName = uuid + "_" + originalFilename;
            Path originalFilePath = uploadDir.resolve(finalFileName);
            Files.copy(file.getInputStream(), originalFilePath, StandardCopyOption.REPLACE_EXISTING);
            finalFileSize = Files.size(originalFilePath);
        }

        String fileUrl = "/uploads/" + finalFileName;
        Path savedFilePath = uploadDir.resolve(finalFileName);

        // Nếu Cloudinary được cấu hình -> Đẩy ảnh lên Cloudinary lưu trữ vĩnh viễn (25GB Free)
        if (cloudinaryService.isConfigured() && Files.exists(savedFilePath)) {
            String cloudUrl = cloudinaryService.uploadImage(savedFilePath.toFile(), uuid);
            if (cloudUrl != null && !cloudUrl.isBlank()) {
                fileUrl = cloudUrl;
                log.info("Media được lưu trữ thành công trên Cloudinary: {}", fileUrl);
            }
        }

        Media media = Media.builder()
                .fileName(originalFilename)
                .fileUrl(fileUrl)
                .fileType(finalContentType)
                .fileSize(finalFileSize)
                .build();

        mediaRepository.save(media);

        return fileUrl;
    }
}
