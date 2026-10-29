package com.news.newsportal.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Cache trong bộ nhớ ứng dụng (thay cho Redis).
 * Cache trang chủ được làm mới định kỳ 10 phút và được xóa khi bài viết được xuất bản.
 */
@Configuration
@EnableCaching
@EnableScheduling
public class CacheConfig {

    private final CacheManager cacheManager = new ConcurrentMapCacheManager("homepage_news");

    @Bean
    public CacheManager cacheManager() {
        return cacheManager;
    }

    @Scheduled(fixedRate = 600_000)
    public void evictHomepageCache() {
        var cache = cacheManager.getCache("homepage_news");
        if (cache != null) {
            cache.clear();
        }
    }
}
