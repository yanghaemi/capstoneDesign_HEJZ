package com.HEJZ.HEJZ_back.domain.community.search.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedRepository;
import com.HEJZ.HEJZ_back.domain.community.feed.service.FeedService;
import com.HEJZ.HEJZ_back.domain.community.search.dto.SearchScope;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final FeedRepository feedRepository;
    private final UserRepository userRepository;

    @Autowired
    private FeedService feedService;

    public ApiResponse<Object> search(String username, String keyword, SearchScope scope, int limit) {
        // try {
        // if (keyword == null || keyword.isBlank())
        // return new ApiResponse<Object>(400, List.of(), "검색어를 입력해주세요.");

        // Long id = userRepository.findIdByUsername(username);

        // var searchFeeds = feedRepository.findFeedByKeyword(keyword, id, scope ==
        // SearchScope.FOLLOWING,
        // PageRequest.of(0, clamp(limit, 1, 100)));

        // if (searchFeeds.isEmpty())
        // return new ApiResponse<Object>(404, searchFeeds, "검색 결과가 없습니다.");

        // return new ApiResponse<Object>(200, searchFeeds, "검색 성공");
        // } catch (Exception e) {
        // // return new ApiResponse<Object>(500, null, "검색 실패" + e);
        // throw new IllegalStateException("검색 실패", e); // 재던지기
        // }
        if (keyword == null || keyword.isBlank()) {
            return new ApiResponse<>(400, List.of(), "검색어를 입력해주세요.");
        }

        Long viewerId = userRepository.findIdByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자: " + username));

        var feeds = feedRepository.findFeedByKeyword(
                keyword, viewerId, scope == SearchScope.FOLLOWING,
                PageRequest.of(0, clamp(limit, 1, 100)));

        var dtos = feeds.stream()
                .map(feedService::toDto)
                .toList();

        if (dtos.isEmpty()) {
            return new ApiResponse<>(404, dtos, "검색 결과가 없습니다.");
        }
        return new ApiResponse<>(200, dtos, "검색 성공");
    }

    private int clamp(int v, int lo, int hi) {
        return Math.max(lo, Math.min(hi, v));
    }
}