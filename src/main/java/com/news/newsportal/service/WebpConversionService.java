package com.news.newsportal.service;

import com.luciad.imageio.webp.WebPWriteParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.Iterator;

@Service
@Slf4j
public class WebpConversionService {

    private static final float DEFAULT_QUALITY = 0.82f; // Chất lượng nén 82% (giữ độ nét cực cao mà dung lượng siêu nhẹ)

    /**
     * Chuyển đổi một luồng ảnh đầu vào (JPG, PNG, GIF, BMP...) sang định dạng WebP và lưu vào file đích.
     * @param inputStream luồng dữ liệu ảnh tải lên
     * @param targetFile đường dẫn file đích .webp
     * @return true nếu chuyển đổi WebP thành công, false nếu định dạng không đọc được bởi ImageIO
     */
    public boolean convertToWebp(InputStream inputStream, Path targetFile) {
        try {
            BufferedImage originalImage = ImageIO.read(inputStream);
            if (originalImage == null) {
                log.warn("Không thể giải mã ảnh đầu vào bằng ImageIO, bỏ qua chuyển đổi WebP");
                return false;
            }

            // Chuyển đổi định dạng màu nếu là loại ảnh đặc thù (tránh lỗi TYPE_CUSTOM hoặc Alpha channel khi ghi WebP)
            BufferedImage convertedImage = new BufferedImage(
                    originalImage.getWidth(),
                    originalImage.getHeight(),
                    originalImage.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB
            );

            Graphics2D g2d = convertedImage.createGraphics();
            g2d.drawImage(originalImage, 0, 0, null);
            g2d.dispose();

            Iterator<ImageWriter> writers = ImageIO.getImageWritersByMIMEType("image/webp");
            if (!writers.hasNext()) {
                log.warn("Không tìm thấy ImageWriter cho định dạng image/webp");
                return false;
            }

            ImageWriter writer = writers.next();
            WebPWriteParam writeParam = new WebPWriteParam(writer.getLocale());
            writeParam.setCompressionMode(WebPWriteParam.MODE_EXPLICIT);
            writeParam.setCompressionType(writeParam.getCompressionTypes()[WebPWriteParam.LOSSY_COMPRESSION]);
            writeParam.setCompressionQuality(DEFAULT_QUALITY);

            File outputFile = targetFile.toFile();
            try (ImageOutputStream ios = new FileImageOutputStream(outputFile)) {
                writer.setOutput(ios);
                writer.write(null, new IIOImage(convertedImage, null, null), writeParam);
            } finally {
                writer.dispose();
            }

            log.info("Chuyển đổi ảnh sang WebP thành công: {} (Kích thước: {} KB)", 
                    targetFile.getFileName(), outputFile.length() / 1024);
            return true;
        } catch (Exception e) {
            log.error("Lỗi khi chuyển đổi ảnh sang WebP: {}", e.getMessage(), e);
            return false;
        }
    }
}
