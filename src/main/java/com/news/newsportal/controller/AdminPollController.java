package com.news.newsportal.controller;

import com.news.newsportal.dto.ApiResponse;
import com.news.newsportal.dto.CreatePollRequest;
import com.news.newsportal.entity.Poll;
import com.news.newsportal.entity.PollOption;
import com.news.newsportal.entity.Post;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.PollRepository;
import com.news.newsportal.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/admin/polls", "/api/admin/polls"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR')")
public class AdminPollController {

    private final PollRepository pollRepository;
    private final PostRepository postRepository;

    /**
     * Danh sách tất cả cuộc bình chọn trong CMS
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Poll>>> getAllPolls() {
        return ResponseEntity.ok(ApiResponse.success(pollRepository.findAllByOrderByCreatedAtDesc()));
    }

    /**
     * Tạo mới cuộc bình chọn
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Poll>> createPoll(@RequestBody CreatePollRequest request) {
        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new IllegalArgumentException("Nội dung câu hỏi bình chọn không được để trống!");
        }
        if (request.getOptions() == null || request.getOptions().size() < 2) {
            throw new IllegalArgumentException("Cuộc bình chọn phải có ít nhất 2 phương án lựa chọn!");
        }

        Poll poll = Poll.builder()
                .question(request.getQuestion().trim())
                .isActive(true)
                .build();

        if (request.getPostId() != null) {
            Post post = postRepository.findById(request.getPostId()).orElse(null);
            poll.setPost(post);
        }

        for (String optText : request.getOptions()) {
            if (optText != null && !optText.isBlank()) {
                PollOption option = PollOption.builder()
                        .poll(poll)
                        .optionText(optText.trim())
                        .votesCount(0)
                        .build();
                poll.getOptions().add(option);
            }
        }

        Poll saved = pollRepository.save(poll);
        return ResponseEntity.ok(ApiResponse.success(saved, "Tạo cuộc bình chọn thành công"));
    }

    /**
     * Bật / Tắt trạng thái hoạt động của bình chọn
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Poll>> togglePollStatus(@PathVariable Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc bình chọn ID: " + id));

        poll.setIsActive(!poll.getIsActive());
        Poll updated = pollRepository.save(poll);
        return ResponseEntity.ok(ApiResponse.success(updated, "Đã cập nhật trạng thái bình chọn"));
    }

    /**
     * Xóa cuộc bình chọn
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePoll(@PathVariable Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc bình chọn ID: " + id));

        pollRepository.delete(poll);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa cuộc bình chọn"));
    }
}

