package com.news.newsportal.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Mã OTP Xác thực Đăng ký Tài khoản News Portal");

            String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;\">"
                    + "<div style=\"background-color: #2563eb; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;\">"
                    + "<h1 style=\"margin: 0; font-size: 24px;\">NEWS PORTAL</h1>"
                    + "</div>"
                    + "<div style=\"padding: 20px; background-color: #ffffff;\">"
                    + "<h2 style=\"color: #1e293b;\">Mã OTP Xác thực Đăng ký</h2>"
                    + "<p style=\"color: #475569; font-size: 16px; line-height: 1.6;\">Dưới đây là mã OTP 6 chữ số để hoàn tất đăng ký tài khoản News Portal của bạn:</p>"
                    + "<div style=\"text-align: center; margin: 30px 0;\">"
                    + "<span style=\"background-color: #f1f5f9; color: #2563eb; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; border: 1px dashed #2563eb; display: inline-block;\">" + otpCode + "</span>"
                    + "</div>"
                    + "<p style=\"color: #64748b; font-size: 14px;\">Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>"
                    + "<p style=\"color: #94a3b8; font-size: 12px; margin-top: 30px; border-t: 1px solid #e2e8f0; padding-top: 10px;\">Nếu bạn không yêu cầu tạo tài khoản, vui lòng bỏ qua email này.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Lỗi gửi OTP Email: " + e.getMessage());
        }
    }
}
