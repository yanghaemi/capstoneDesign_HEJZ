package com.HEJZ.HEJZ_back.domain.community.search.service;

import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.global.response.ApiResponse;

@Service
public class SearchService {

    public ApiResponse<Object> search(String keyword) {
        try {

            String result = "앙";
            // TODO: feed랑 연결하여 feed 테이블에서 키워드 검색

            return new ApiResponse<Object>(200, result, "검색 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "검색 실패");
        }
    }
}