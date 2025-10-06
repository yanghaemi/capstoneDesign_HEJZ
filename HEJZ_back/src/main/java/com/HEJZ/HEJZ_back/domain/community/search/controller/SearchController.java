package com.HEJZ.HEJZ_back.domain.community.search.controller;

import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.HEJZ.HEJZ_back.domain.community.search.service.SearchService;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
@RequestMapping("api/search")
public class SearchController {
    // 검색 관련 컨트롤러

    private final SearchService searchService;

    /*
     * 호출 url : http://localhost:8080/api/search?{param}
     * 설명 : 검색
     * method : get
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Object>> search(@Param("keyword") String keyword) {
        ApiResponse<Object> result = searchService.search(keyword);

        return ResponseEntity.ok(result);
    }
}
