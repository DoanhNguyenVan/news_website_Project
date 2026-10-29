package com.news.newsportal.service;

import com.news.newsportal.dto.DocxImportResultDTO;
import com.news.newsportal.entity.Media;
import com.news.newsportal.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.zwobble.mammoth.DocumentConverter;
import org.zwobble.mammoth.Result;
import org.zwobble.mammoth.images.Image;
import org.zwobble.mammoth.images.ImageConverter;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocxImportService {

    private final MediaRepository mediaRepository;
    private final WebpConversionService webpConversionService;

    private Path getUploadDir() throws IOException {
        String userHome = System.getProperty("user.home");
        Path uploadDir = Paths.get(userHome, "uploads");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
        return uploadDir;
    }

    public DocxImportResultDTO convertDocxToCleanHtml(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File Word tải lên không được để trống");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".docx")) {
            throw new IllegalArgumentException("Hệ thống chỉ hỗ trợ định dạng file Microsoft Word (.docx)");
        }

        List<String> extractedImages = new ArrayList<>();
        Path uploadDir = getUploadDir();

        // Custom Image Converter for Mammoth (using ImageConverter.ImgElement interface)
        ImageConverter.ImgElement imageConverter = new ImageConverter.ImgElement() {
            @Override
            public Map<String, String> convert(Image image) throws IOException {
                try {
                    String contentType = image.getContentType();
                    String uuid = UUID.randomUUID().toString();
                    String fileName = "docx_img_" + uuid + ".webp";
                    Path filePath = uploadDir.resolve(fileName);

                    byte[] imageBytes;
                    try (InputStream inputStream = image.getInputStream()) {
                        imageBytes = inputStream.readAllBytes();
                    }

                    boolean converted = webpConversionService.convertToWebp(new java.io.ByteArrayInputStream(imageBytes), filePath);

                    if (!converted || !Files.exists(filePath)) {
                        String ext = ".jpg";
                        if (contentType != null && contentType.contains("png")) ext = ".png";
                        fileName = "docx_img_" + uuid + ext;
                        filePath = uploadDir.resolve(fileName);
                        Files.write(filePath, imageBytes);
                    }

                    String fileUrl = "/uploads/" + fileName;
                    extractedImages.add(fileUrl);

                    // Save image metadata into DB
                    try {
                        Media media = Media.builder()
                                .fileName(fileName)
                                .fileUrl(fileUrl)
                                .fileType(contentType != null ? contentType : "image/jpeg")
                                .fileSize(Files.exists(filePath) ? Files.size(filePath) : 0L)
                                .build();
                        mediaRepository.save(media);
                    } catch (Exception e) {
                        // Ignore DB errors
                    }

                    Map<String, String> attributes = new HashMap<>();
                    attributes.put("src", fileUrl);
                    attributes.put("class", "my-4 rounded-2xl max-w-full shadow-md inline-block docx-imported-image");
                    return attributes;

                } catch (Exception e) {
                    log.error("Lỗi khi xử lý hình ảnh từ file Word (.docx): {}", e.getMessage(), e);
                    return new HashMap<>();
                }
            }
        };

        DocumentConverter converter = new DocumentConverter()
                .imageConverter(imageConverter);

        Result<String> result;
        try (InputStream docxStream = file.getInputStream()) {
            result = converter.convertToHtml(docxStream);
        }

        String htmlContent = result.getValue();
        if (htmlContent != null) {
            htmlContent = htmlContent.trim();
        } else {
            htmlContent = "";
        }

        // Bóc tách Tiêu đề (Headline) và Sapo từ HTML
        String extractedTitle = extractTitleFromHtml(htmlContent);
        String extractedSapo = extractSapoFromHtml(htmlContent);

        return DocxImportResultDTO.builder()
                .title(extractedTitle)
                .sapo(extractedSapo)
                .htmlContent(htmlContent)
                .extractedImages(extractedImages)
                .build();
    }

    private String extractTitleFromHtml(String html) {
        if (html == null || html.isEmpty()) return "";
        
        Pattern hPattern = Pattern.compile("<h[1-2][^>]*>(.*?)</h[1-2]>", Pattern.CASE_INSENSITIVE);
        Matcher hMatcher = hPattern.matcher(html);
        if (hMatcher.find()) {
            return stripHtml(hMatcher.group(1));
        }

        Pattern pPattern = Pattern.compile("<p[^>]*>(.*?)</p>", Pattern.CASE_INSENSITIVE);
        Matcher pMatcher = pPattern.matcher(html);
        if (pMatcher.find()) {
            String pText = stripHtml(pMatcher.group(1));
            if (pText.length() > 5 && pText.length() < 150) {
                return pText;
            }
        }

        return "Bài viết mới từ file Word";
    }

    private String extractSapoFromHtml(String html) {
        if (html == null || html.isEmpty()) return "";

        Pattern pPattern = Pattern.compile("<p[^>]*>(.*?)</p>", Pattern.CASE_INSENSITIVE);
        Matcher pMatcher = pPattern.matcher(html);
        
        int count = 0;
        while (pMatcher.find()) {
            count++;
            String pText = stripHtml(pMatcher.group(1));
            if (count == 1 && pText.length() >= 120) {
                return pText;
            }
            if (count == 2 && pText.length() > 20) {
                return pText;
            }
        }

        return "";
    }

    private String stripHtml(String input) {
        if (input == null) return "";
        return input.replaceAll("<[^>]*>", "").trim();
    }
}
