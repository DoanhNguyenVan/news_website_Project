package com.news.newsportal.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoint siêu nhẹ phục vụ Cron-job (Cron-job.org / UptimeRobot)
 * để giữ cho ứng dụng thức 24/7 trên Render mà KHÔNG gọi vào Database.
 */
@RestController
@RequestMapping({"/api/v1/public/ping", "/ping"})
public class PublicPingController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> ping() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "message", "pong",
                "timestamp", System.currentTimeMillis()
        ));
    }
}

