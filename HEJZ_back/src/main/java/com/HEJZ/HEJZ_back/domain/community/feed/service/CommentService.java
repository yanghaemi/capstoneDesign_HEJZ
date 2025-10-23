package com.HEJZ.HEJZ_back.domain.community.feed.service;

import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CommentService {

    public ApiResponse<Object> createComment(String comment) {

        try {

            if (comment.equals("") || comment == null) {
                return new ApiResponse<Object>(404, null, "댓글은 비울 수 없습니다.");
            }

            return new ApiResponse<Object>(200, comment, "댓글 생성 완료");

        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "댓글 생성 실패");
        }
    }

    public ApiResponse<Object> deleteComment(Long commentId) {
        try {
            if (commentId == null) {
                return new ApiResponse<Object>(404, null, "댓글은 비울 수 없습니다.");

            }

            // TODO: comment DTO 만들어서 return data에 넣기
            return new ApiResponse<Object>(200, commentId, "댓글 삭제 성공");

        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "댓글 삭제 실패");

        }
    }
}
