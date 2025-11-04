package com.HEJZ.HEJZ_back.domain.community.feed.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentDeleteRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentCreateRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.service.CommentService;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    // 댓글 컨트롤러

    private final CommentService commentService;

    /*
     * 호출 url: http://localhost:8080/api/comments/create
     * 설명: 댓글 생성
     * method: post
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Object>> createComment(@RequestBody CommentCreateRequest createReq) {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String username = authentication.getName();

        ApiResponse<Object> result = commentService.createComment(createReq, username);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url: http://localhost:8080/api/comments/getcomments
     * 설명: 피드 댓글 조회
     * method: post
     */
    @PostMapping("/getcomments")
    public ResponseEntity<ApiResponse<Object>> getComments(@RequestBody CommentRequest req) {

        ApiResponse<Object> result = commentService.getFeedComments(req.getFeedId());

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url: http://localhost:8080/api/comments/getmycomments
     * 설명: 내 댓글 조회
     * method: get
     */
    @GetMapping("/getmycomments")
    public ResponseEntity<ApiResponse<Object>> getMyComments() {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        String username = authentication.getName();
        ApiResponse<Object> result = commentService.getMyComments(username);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url: http://localhost:8080/api/comments/delete
     * 설명: 댓글 삭제
     * method: delete
     */
    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<Object>> deleteComment(@RequestBody CommentDeleteRequest deleteReq) {

        ApiResponse<Object> result = commentService.deleteComment(deleteReq.getCommentId());

        return ResponseEntity.ok(result);
    }

}
