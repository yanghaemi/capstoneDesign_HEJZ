package com.HEJZ.HEJZ_back.domain.community.feed.controller;

import com.HEJZ.HEJZ_back.domain.community.feed.service.RateLimitService;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.*;
import com.HEJZ.HEJZ_back.domain.community.feed.service.FeedService;
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

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("인증 필요");
        }
        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username);
        if (user == null) throw new RuntimeException("유저 없음: " + username);
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