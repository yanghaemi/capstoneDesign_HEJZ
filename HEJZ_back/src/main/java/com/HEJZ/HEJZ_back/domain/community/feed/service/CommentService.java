package com.HEJZ.HEJZ_back.domain.community.feed.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentCreateRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentDto;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentLikeEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.CommentRepository;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedRepository;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final FeedRepository feedRepository;

    public ApiResponse<Object> createComment(CommentCreateRequest commentRequest, String username) {

        try {

            if (commentRequest.getComment().equals("") || commentRequest == null
                    || commentRequest.getComment().isEmpty()) {
                return new ApiResponse<Object>(404, null, "댓글은 비울 수 없습니다.");
            }

            UserEntity user = userRepository.findByUsername(username);
            if (user == null) {
                return new ApiResponse<Object>(404, null, "유저를 찾을 수 없습니다.");
            }

            List<CommentLikeEntity> commentLike = new ArrayList<>();

            FeedEntity feed = feedRepository.findById(commentRequest.getFeedId())
                    .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다."));

            CommentEntity newComment = new CommentEntity();
            newComment.setComment(commentRequest.getComment());
            newComment.setCommentLike(commentLike);
            newComment.setFeed(feed);
            newComment.setUser(user);

            commentRepository.save(newComment);

            return new ApiResponse<Object>(200, newComment, "댓글 생성 완료");

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
