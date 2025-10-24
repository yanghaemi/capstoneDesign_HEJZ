package com.HEJZ.HEJZ_back.domain.community.feed.controller;

import com.HEJZ.HEJZ_back.domain.community.follow.repository.FollowRepository;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedCreateRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.service.FeedService;
import com.HEJZ.HEJZ_back.domain.community.feed.service.RateLimitService;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feeds")
@RequiredArgsConstructor
public class FeedController {
    private final FeedService feedService;
    private final UserRepository userRepository;
    private final RateLimitService rateLimitService;
    private final FollowRepository followRepository;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null)
            throw new RuntimeException("인증 필요");
        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username);
        if (user == null)
            throw new RuntimeException("유저 없음: " + username);
        return user.getId();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> create(@Valid @RequestBody FeedCreateRequest request) {
        Long userId = getCurrentUserId();
        if (!rateLimitService.allowRequest(userId)) {
            return ResponseEntity.status(429)
                    .body(new ApiResponse<>(429, null, "요청 횟수 초과. 1분 후 다시 시도해주세요."));
        }
        var dto = feedService.createFeed(userId, request);
        return ResponseEntity.ok(new ApiResponse<>(200, dto, "피드 생성 성공"));
    }

    // 내 피드(본인만 보는 용도)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Object>> myFeeds(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String cursor) {
        Long userId = getCurrentUserId();
        if (!rateLimitService.allowRequest(userId)) {
            return ResponseEntity.status(429)
                    .body(new ApiResponse<>(429, null, "요청 횟수 초과. 1분 후 다시 시도해주세요."));
        }
        var response = feedService.getMyFeeds(userId, limit, cursor);
        return ResponseEntity.ok(new ApiResponse<>(200, response, "조회 성공"));
    }

    // 타인 피드: 팔로워만 접근 허용
    @GetMapping("/user/{username}")
    public ResponseEntity<ApiResponse<Object>> userFeeds(
            @PathVariable String username,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String cursor) {

        Long viewerId = getCurrentUserId(); // 조회자(나)
        var viewer = userRepository.findById(viewerId).orElseThrow(() -> new RuntimeException("viewer 없음"));
        var target = userRepository.findByUsername(username);
        if (target == null) {
            return ResponseEntity.status(404).body(new ApiResponse<>(404, null, "유저 없음"));
        }

        boolean allowed = viewer.getId().equals(target.getId()); // 본인은 항상 허용
        if (!allowed) {
            boolean isFollower = followRepository
                    .existsByFollower_UsernameAndFollowing_Username(viewer.getUsername(), username);
            allowed = isFollower;
        }

        if (!allowed) {
            return ResponseEntity.status(403).body(new ApiResponse<>(403, null, "팔로워만 열람 가능합니다."));
        }

        if (!rateLimitService.allowRequest(viewerId)) {
            return ResponseEntity.status(429)
                    .body(new ApiResponse<>(429, null, "요청 횟수 초과. 1분 후 다시 시도해주세요."));
        }

        var resp = feedService.getMyFeeds(target.getId(), limit, cursor);
        return ResponseEntity.ok(new ApiResponse<>(200, resp, "조회 성공"));
    }

    // 타임라인: 내가 팔로우하는 사람들의 피드
    @GetMapping("/timeline")
    public ResponseEntity<ApiResponse<Object>> timeline(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String cursor) {
        Long userId = getCurrentUserId();
        if (!rateLimitService.allowRequest(userId)) {
            return ResponseEntity.status(429)
                    .body(new ApiResponse<>(429, null, "요청 횟수 초과. 1분 후 다시 시도해주세요."));
        }
        var resp = feedService.getTimelineFeeds(userId, limit, cursor);
        return ResponseEntity.ok(new ApiResponse<>(200, resp, "조회 성공"));
    }

    @DeleteMapping("/{feedId}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Long feedId) {
        Long userId = getCurrentUserId();
        if (!rateLimitService.allowRequest(userId)) {
            return ResponseEntity.status(429)
                    .body(new ApiResponse<>(429, null, "요청 횟수 초과. 1분 후 다시 시도해주세요."));
        }
        feedService.deleteFeed(userId, feedId);
        return ResponseEntity.ok(new ApiResponse<>(200, null, "삭제 성공"));
    }
}
