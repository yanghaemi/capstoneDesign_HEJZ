package com.HEJZ.HEJZ_back.domain.community.feed.controller;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.LikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.service.LikeService;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/feeds/like")
@RequiredArgsConstructor
public class LikeController {
    private final LikeService likeService;

    /*
    호출 url: http://localhost:8080/api/feeds/like
    설명: 좋아요
    메소드: post
     */
    @PostMapping("/")
    public ResponseEntity<ApiResponse<Object>> like(@RequestBody LikeRequest likeRequest){

        ApiResponse<Object> result = likeService.like(likeRequest);

        return ResponseEntity.ok(result);
    }

    /*
    호출 url: http://localhost:8080/api/feeds/like/get_list_of_like
    설명: 해당 게시글 좋아요 누른 유저 리스트 조회
    메소드: post
     */
    @PostMapping("/get_list_of_like")
    public ResponseEntity<ApiResponse<Object>> getListOfLike(@RequestBody LikeRequest likeRequest){

        ApiResponse<Object> result = likeService.like(likeRequest);

        return ResponseEntity.ok(result);
    }

    /*
    호출 url: http://localhost:8080/api/feeds/get_my_list_of_like
    설명: 내가 좋아요 누른 게시글 리스트 조회
    메소드: get
     */
    @GetMapping("/get_my_list_of_like")
    public ResponseEntity<ApiResponse<Object>> getMyListOfLike(@RequestBody LikeRequest likeRequest){

        ApiResponse<Object> result = likeService.like(likeRequest);

        return ResponseEntity.ok(result);
    }
}
