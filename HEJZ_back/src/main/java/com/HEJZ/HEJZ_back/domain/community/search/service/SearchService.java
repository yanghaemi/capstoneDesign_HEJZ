package com.HEJZ.HEJZ_back.domain.community.search.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.Feed;
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

            // TODO: feed랑 연결하여 feed 테이블에서 키워드 검색
            List<Feed> searchFeeds = feedRepository.findFeedByKeyword(keyword);
            // List<Feed> searchFeeds =
            // feedRepository.findByContentContainingIgnoreCase(keyword);

            return new ApiResponse<Object>(200, searchFeeds, "검색 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "검색 실패");
        }
    }
}