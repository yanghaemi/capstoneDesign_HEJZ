package com.HEJZ.HEJZ_back.domain.community.feed.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentDeleteRequest;
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

        ApiResponse<Object> result = commentService.createComment(createReq.getComment());

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
