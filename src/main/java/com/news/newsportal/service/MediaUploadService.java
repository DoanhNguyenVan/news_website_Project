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

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String uuid = UUID.randomUUID().toString();
        String finalContentType = contentType;
        long finalFileSize = file.getSize();

        String fileUrl;

        // Nếu Cloudinary được cấu hình -> Upload ảnh/video gốc trực tiếp lên Cloudinary
        // Cloudinary sẽ tự tối ưu hóa (f_auto, q_auto) mà không cần chuyển đổi local
        if (cloudinaryService.isConfigured()) {
            Path uploadDir = getUploadDir();
            String ext = originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                    : "";
            String tmpFileName = uuid + ext;
            Path tmpFilePath = uploadDir.resolve(tmpFileName);
            Files.copy(file.getInputStream(), tmpFilePath, StandardCopyOption.REPLACE_EXISTING);
            finalFileSize = Files.size(tmpFilePath);

            String cloudUrl = cloudinaryService.uploadImage(tmpFilePath.toFile(), uuid);

            // Dọn file tạm sau khi đã upload lên Cloudinary
            try { Files.deleteIfExists(tmpFilePath); } catch (Exception ignored) {}

            if (cloudUrl != null && !cloudUrl.isBlank()) {
                fileUrl = cloudUrl;
                log.info("Media được lưu trữ thành công trên Cloudinary: {}", fileUrl);
            } else {
                // Cloudinary upload thất bại, fallback lưu local
                fileUrl = "/uploads/" + tmpFileName;
                Files.copy(file.getInputStream(), uploadDir.resolve(tmpFileName), StandardCopyOption.REPLACE_EXISTING);
            }
        } else {
            // Cloudinary chưa cấu hình -> Lưu file gốc vào thư mục uploads local
            Path uploadDir = getUploadDir();
            String ext = originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                    : "";
            String localFileName = uuid + ext;
            Path localFilePath = uploadDir.resolve(localFileName);
            Files.copy(file.getInputStream(), localFilePath, StandardCopyOption.REPLACE_EXISTING);
            finalFileSize = Files.size(localFilePath);
            fileUrl = "/uploads/" + localFileName;
            log.info("Media được lưu local (Cloudinary chưa cấu hình): {}", fileUrl);
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
