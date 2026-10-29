package com.news.newsportal.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lưu mã OTP đăng ký trong bộ nhớ ứng dụng, tự hết hạn sau thời gian TTL.
 * Thay thế Redis để hệ thống chạy được mà không cần cài Redis server.
 */
@Component
public class OtpStore {

    private record Entry(String otp, Instant expiresAt) {}

    private static final Duration TTL = Duration.ofMinutes(5);

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public void put(String key, String otp) {
        store.put(key, new Entry(otp, Instant.now().plus(TTL)));
    }

    /** Trả về OTP nếu còn hạn, ngược lại trả về rỗng (và xóa bản ghi hết hạn). */
    public Optional<String> get(String key) {
        Entry entry = store.get(key);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAt().isBefore(Instant.now())) {
            store.remove(key);
            return Optional.empty();
        }
        return Optional.of(entry.otp());
    }

    public void remove(String key) {
        store.remove(key);
    }

    /** Dọn các OTP đã hết hạn mỗi phút để tránh rò rỉ bộ nhớ. */
    @Scheduled(fixedRate = 60_000)
    public void evictExpired() {
        Instant now = Instant.now();
        store.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(now));
    }
}
