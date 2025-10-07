package com.HEJZ.HEJZ_back.domain.community.search.controller;

import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.HEJZ.HEJZ_back.domain.community.search.dto.SearchScope;
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
     * 호출 url : http://localhost:8080/api/search?keyword={keyword}
     * 설명 : 검색
     * method : get
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Object>> search(
            @RequestParam(defaultValue = "ALL") SearchScope scope,
            @RequestParam(defaultValue = "20") int limit,
            @Param("keyword") String keyword) {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String myUsername = authentication.getName(); // jwt 토큰으로 내 아이디 받기

        ApiResponse<Object> result = searchService.search(myUsername, keyword, scope, limit);

        return ResponseEntity.ok(result);
    }
}
