package com.HEJZ.HEJZ_back.domain.community.search.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedRepository;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final FeedRepository feedRepository;

    @Transactional
    public ApiResponse<Object> search(String keyword) {
        try {

            if (keyword == null || keyword.isBlank())
                return new ApiResponse<Object>(400, List.of(), "검색어를 입력해주세요.");

            var searchFeeds = feedRepository.findFeedByKeyword(keyword);
            if (searchFeeds.isEmpty())
                return new ApiResponse<Object>(404, searchFeeds, "검색 결과가 없습니다.");

            return new ApiResponse<Object>(200, searchFeeds, "검색 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "검색 실패" + e);
        }
    }
}