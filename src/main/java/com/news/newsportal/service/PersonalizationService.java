package com.news.newsportal.service;

import com.news.newsportal.dto.PostDTO;
import com.news.newsportal.entity.*;
import com.news.newsportal.exception.ResourceNotFoundException;
import com.news.newsportal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PersonalizationService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final BookmarkRepository bookmarkRepository;
    private final UserTopicPreferenceRepository topicPreferenceRepository;
    private final CategoryRepository categoryRepository;
    private final NewsService newsService;

    /**
     * 1. GHI NHẬN LỊCH SỬ ĐỌC BÀI VIẾT (Cực nhẹ, không gây đầy RAM)
     */
    @Transactional
    public void recordReading(String username, Long postId) {
        if (username == null || "anonymousUser".equalsIgnoreCase(username)) {
            return;
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return;

        Post post = postRepository.findById(postId).orElse(null);
        if (post == null || post.getStatus() != PostStatus.PUBLISHED) return;

        try {
            ReadingHistory history = ReadingHistory.builder()
                    .user(user)
                    .post(post)
                    .readAt(LocalDateTime.now())
                    .build();
            readingHistoryRepository.save(history);
        } catch (Exception e) {
            log.debug("Record reading history ignored: {}", e.getMessage());
        }
    }

    /**
     * 2. LƯU / BỎ LƯU BÀI VIẾT (TOGGLE BOOKMARK)
     */
    @Transactional
    public boolean toggleBookmark(String username, Long postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại"));

        Optional<Bookmark> existing = bookmarkRepository.findByUserIdAndPostId(user.getId(), postId);
        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            return false;
        } else {
            Bookmark bookmark = Bookmark.builder()
                    .user(user)
                    .post(post)
                    .createdAt(LocalDateTime.now())
                    .build();
            bookmarkRepository.save(bookmark);
            return true;
        }
    }

    /**
     * Kiểm tra trạng thái bookmark bài viết
     */
    @Transactional(readOnly = true)
    public boolean isBookmarked(String username, Long postId) {
        if (username == null || "anonymousUser".equalsIgnoreCase(username)) return false;
        return userRepository.findByUsername(username)
                .map(u -> bookmarkRepository.existsByUserIdAndPostId(u.getId(), postId))
                .orElse(false);
    }

    /**
     * 3. LẤY DANH SÁCH BÀI VIẾT ĐÃ LƯU (BOOKMARKS)
     */
    @Transactional(readOnly = true)
    public List<PostDTO> getUserBookmarks(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        return bookmarkRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size))
                .stream()
                .map(b -> newsService.convertToDTO(b.getPost()))
                .collect(Collectors.toList());
    }

    /**
     * 4. LẤY LỊCH SỬ ĐỌC GẦN ĐÂY
     */
    @Transactional(readOnly = true)
    public List<PostDTO> getUserReadingHistory(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // Deduplicate posts
        Set<Long> seenIds = new HashSet<>();
        List<PostDTO> result = new ArrayList<>();

        List<ReadingHistory> list = readingHistoryRepository.findByUserIdOrderByReadAtDesc(user.getId(), PageRequest.of(page, size * 2));
        for (ReadingHistory rh : list) {
            if (seenIds.add(rh.getPost().getId())) {
                result.add(newsService.convertToDTO(rh.getPost()));
                if (result.size() >= size) break;
            }
        }
        return result;
    }

    @Transactional
    public void clearReadingHistory(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
        readingHistoryRepository.deleteByUserId(user.getId());
    }

    /**
     * 5. LƯU & LẤY CHỦ ĐỀ QUAN TÂM (TOPIC ONBOARDING)
     */
    @Transactional(readOnly = true)
    public List<Long> getUserTopicPreferences(String username) {
        return userRepository.findByUsername(username)
                .map(u -> topicPreferenceRepository.findCategoryIdsByUserId(u.getId()))
                .orElse(Collections.emptyList());
    }

    @Transactional
    public List<Long> saveUserTopicPreferences(String username, List<Long> categoryIds) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        topicPreferenceRepository.deleteByUserId(user.getId());

        if (categoryIds != null && !categoryIds.isEmpty()) {
            List<Category> categories = categoryRepository.findAllById(categoryIds);
            for (Category cat : categories) {
                UserTopicPreference pref = UserTopicPreference.builder()
                        .user(user)
                        .category(cat)
                        .createdAt(LocalDateTime.now())
                        .build();
                topicPreferenceRepository.save(pref);
            }
        }

        return categoryIds != null ? categoryIds : Collections.emptyList();
    }

    /**
     * 6. THUẬT TOÁN ĐỀ XUẤT "DÀNH CHO BẠN" (FOR YOU - ZERO COST, IN-DATABASE)
     * - Kết hợp sở thích chủ động (Preferences) + Lịch sử đọc thực tế (History)
     * - Khách vãng lai: Nhận danh sách categoryIds từ localStorage trình duyệt
     */
    @Transactional(readOnly = true)
    public List<PostDTO> getPersonalizedRecommendations(String username, List<Long> guestCategoryIds, List<Long> guestExcludeIds, int limit) {
        List<Long> targetCategoryIds = new ArrayList<>();
        List<Long> excludePostIds = new ArrayList<>();

        if (guestExcludeIds != null) {
            excludePostIds.addAll(guestExcludeIds);
        }

        // Nếu là độc giả có tài khoản
        if (username != null && !"anonymousUser".equalsIgnoreCase(username)) {
            userRepository.findByUsername(username).ifPresent(user -> {
                // 1. Lấy chuyên mục từ sở thích chủ động
                List<Long> prefCatIds = topicPreferenceRepository.findCategoryIdsByUserId(user.getId());
                targetCategoryIds.addAll(prefCatIds);

                // 2. Lấy thêm top 3 chuyên mục đọc nhiều nhất từ lịch sử
                List<Long> historyCatIds = readingHistoryRepository.findTopCategoryIdsByUserId(user.getId(), PageRequest.of(0, 3));
                for (Long cid : historyCatIds) {
                    if (!targetCategoryIds.contains(cid)) {
                        targetCategoryIds.add(cid);
                    }
                }

                // 3. Lấy 10 bài đọc gần nhất để không đề xuất lặp
                List<Long> recentReadIds = readingHistoryRepository.findReadPostIdsByUserId(user.getId(), PageRequest.of(0, 10));
                excludePostIds.addAll(recentReadIds);
            });
        } else if (guestCategoryIds != null && !guestCategoryIds.isEmpty()) {
            targetCategoryIds.addAll(guestCategoryIds);
        }

        List<Post> candidatePosts = new ArrayList<>();

        // Nếu có chuyên mục mục tiêu
        if (!targetCategoryIds.isEmpty()) {
            candidatePosts = postRepository.findForYouByCategory(
                    targetCategoryIds,
                    excludePostIds.isEmpty() ? null : excludePostIds,
                    PageRequest.of(0, limit)
            );
        }

        // Bổ sung nếu chưa đủ số lượng bài yêu cầu (Fallback trending/latest)
        if (candidatePosts.size() < limit) {
            Set<Long> alreadyPicked = candidatePosts.stream().map(Post::getId).collect(Collectors.toSet());
            alreadyPicked.addAll(excludePostIds);

            List<Post> fallbacks = postRepository.findByStatusOrderByViewsCountDesc(PostStatus.PUBLISHED, PageRequest.of(0, limit));
            for (Post fp : fallbacks) {
                if (alreadyPicked.add(fp.getId())) {
                    candidatePosts.add(fp);
                    if (candidatePosts.size() >= limit) break;
                }
            }
        }

        return candidatePosts.stream()
                .map(newsService::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 7. THUẬT TOÁN ĐỀ XUẤT NỘI DUNG TƯƠNG ĐỒNG THẺ TAG & CHUYÊN MỤC (CONTENT-BASED)
     */
    @Transactional(readOnly = true)
    public List<PostDTO> getSmartRelatedPosts(Long postId, int limit) {
        Post currentPost = postRepository.findById(postId).orElse(null);
        if (currentPost == null) return Collections.emptyList();

        List<Post> related = new ArrayList<>();
        Set<Long> tagIds = currentPost.getTags() != null 
                ? currentPost.getTags().stream().map(Tag::getId).collect(Collectors.toSet())
                : Collections.emptySet();

        // Bước 1: Ưu tiên quét bài viết có tag tương đồng (JPA Tag matching)
        if (!tagIds.isEmpty()) {
            related = postRepository.findSmartRelatedByTags(postId, tagIds, PageRequest.of(0, limit));
        }

        // Bước 2: Nếu chưa đủ, bổ sung bài viết cùng chuyên mục có lượt đọc cao
        if (related.size() < limit && currentPost.getCategory() != null) {
            Set<Long> picked = related.stream().map(Post::getId).collect(Collectors.toSet());
            picked.add(postId);

            List<Post> categoryPosts = postRepository.findRelatedByCategoryFallback(
                    postId, 
                    currentPost.getCategory().getId(), 
                    PageRequest.of(0, limit * 2)
            );

            for (Post p : categoryPosts) {
                if (picked.add(p.getId())) {
                    related.add(p);
                    if (related.size() >= limit) break;
                }
            }
        }

        return related.stream()
                .map(newsService::convertToDTO)
                .collect(Collectors.toList());
    }
}

