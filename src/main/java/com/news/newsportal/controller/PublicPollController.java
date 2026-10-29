package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.entity.Poll;
import com.news.newsportal.entity.PollOption;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.PollOptionRepository;
import com.news.newsportal.repository.PollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/public/polls", "/api/v1/news/polls"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PublicPollController {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;

    /**
     * Lấy cuộc bình chọn cho một bài viết cụ thể
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<ApiResponse<Poll>> getPollByPostId(@PathVariable Long postId) {
        List<Poll> polls = pollRepository.findByPostIdAndIsActiveTrue(postId);
        if (polls.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(null, "Không có bình chọn cho bài viết này"));
        }
        return ResponseEntity.ok(ApiResponse.success(polls.get(0)));
    }

    /**
     * Lấy cuộc bình chọn nổi bật mới nhất (dùng cho Trang chủ hoặc Widget chung)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<Poll>> getLatestActivePoll() {
        Poll poll = pollRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc().orElse(null);
        return ResponseEntity.ok(ApiResponse.success(poll));
    }

    /**
     * Độc giả vote cho một phương án bình chọn
     */
    @PostMapping("/vote/{optionId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> voteOption(@PathVariable Long optionId) {
        PollOption option = pollOptionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương án bình chọn này!"));

        pollOptionRepository.incrementVotesCount(optionId);

        // Nạp lại poll để tính toán phần trăm cho từng phương án
        Poll poll = pollRepository.findById(option.getPoll().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bình chọn không tồn tại"));

        int totalVotes = poll.getOptions().stream().mapToInt(po -> po.getId().equals(optionId) ? po.getVotesCount() + 1 : po.getVotesCount()).sum();

        List<Map<String, Object>> optionsWithStats = poll.getOptions().stream().map(po -> {
            int currentVotes = po.getId().equals(optionId) ? po.getVotesCount() + 1 : po.getVotesCount();
            double percent = totalVotes > 0 ? Math.round((currentVotes * 100.0 / totalVotes) * 10.0) / 10.0 : 0.0;
            Map<String, Object> map = new HashMap<>();
            map.put("id", po.getId());
            map.put("optionText", po.getOptionText());
            map.put("votesCount", currentVotes);
            map.put("percentage", percent);
            return map;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("pollId", poll.getId());
        result.put("question", poll.getQuestion());
        result.put("totalVotes", totalVotes);
        result.put("options", optionsWithStats);

        return ResponseEntity.ok(ApiResponse.success(result, "Cảm ơn bạn đã tham gia bình chọn!"));
    }
}

