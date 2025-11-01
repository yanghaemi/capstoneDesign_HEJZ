package com.HEJZ.HEJZ_back.domain.community.feed.controller;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentLikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedLikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.LikeListRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.MyLikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.service.LikeService;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/feeds/like")
@RequiredArgsConstructor
public class LikeController {
    private final LikeService likeService;

    /*
     * 호출 url: http://localhost:8080/api/feeds/like/comment
     * 설명: 댓글 좋아요
     * 메소드: post
     */
    @PostMapping("/comment")
    public ResponseEntity<ApiResponse<Object>> commentLike(@RequestBody CommentLikeRequest likeRequest) {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String username = authentication.getName();

        ApiResponse<Object> result = likeService.commentLike(likeRequest, username);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url: http://localhost:8080/api/feeds/like/feed
     * 설명: 피드 좋아요
     * 메소드: post
     */
    @PostMapping("/feed")
    public ResponseEntity<ApiResponse<Object>> feedLike(@RequestBody FeedLikeRequest likeRequest) {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String username = authentication.getName();

        ApiResponse<Object> result = likeService.feedLike(likeRequest, username);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url: http://localhost:8080/api/feeds/like/get_list_of_like
     * 설명: 해당 게시글 좋아요 누른 유저 리스트 조회
     * 메소드: post
     */
    @PostMapping("/get_list_of_like")
    public ResponseEntity<ApiResponse<Object>> getListOfLike(@RequestBody LikeListRequest likeRequest) {

        ApiResponse<Object> result = likeService.getListOfLike(likeRequest);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url: http://localhost:8080/api/feeds/get_my_list_of_like
     * 설명: 내가 좋아요 누른 게시글 리스트 조회
     * 메소드: get
     */
    @GetMapping("/get_my_list_of_like")
    public ResponseEntity<ApiResponse<Object>> getMyListOfLike() {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String username = authentication.getName();

        ApiResponse<Object> result = likeService.getMyListOfLike(username);

        return ResponseEntity.ok(result);
    }
}
